import {
  SignalStoreFeature,
  patchState,
  signalStoreFeature,
  withComputed,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import { EntityId, EntityMap, EntityState } from '@ngrx/signals/entities';
import { Signal, effect, signal, untracked, isSignal } from '@angular/core';
import { Entity, capitalize } from './with-data-service';
import {
  EntityComputed,
  NamedEntityComputed,
} from './shared/signal-store-models';

export type StackItem = Record<string, unknown>;

export type NormalizedUndoRedoOptions = {
  maxStackSize: number;
  collections?: string[];
};

const defaultOptions: NormalizedUndoRedoOptions = {
  maxStackSize: 100,
};

export type NamedUndoRedoState<Collection extends string> = {
  [K in Collection as `${K}EntityMap`]: EntityMap<Entity>;
} & {
  [K in Collection as `${K}Ids`]: EntityId[];
};

export type NamedUndoRedoSignals<Collection extends string> = {
  [K in Collection as `${K}Entities`]: Signal<Entity[]>;
};

export function getUndoRedoKeys(collections?: string[]): string[] {
  if (collections) {
    return collections.flatMap((c) => [
      `${c}EntityMap`,
      `${c}Ids`,
      `selected${capitalize(c)}Ids`,
      `${c}Filter`,
    ]);
  }
  return ['entityMap', 'ids', 'selectedIds', 'filter'];
}

export function withUndoRedo<Collection extends string>(options?: {
  maxStackSize?: number;
  collections: Collection[];
}): SignalStoreFeature<
  {
    state: {};
    // This alternative breaks type inference:
    // state: NamedEntityState<Entity, Collection>
    computed: NamedEntityComputed<Entity, Collection>;
    methods: {};
  },
  {
    state: {};
    computed: {
      canUndo: Signal<boolean>;
      canRedo: Signal<boolean>;
    };
    methods: {
      undo: () => void;
      redo: () => void;
    };
  }
>;

export function withUndoRedo(options?: {
  maxStackSize?: number;
}): SignalStoreFeature<
  {
    state: EntityState<Entity>;
    computed: EntityComputed<Entity>;
    methods: {};
  },
  {
    state: {};
    computed: {
      canUndo: Signal<boolean>;
      canRedo: Signal<boolean>;
    };
    methods: {
      undo: () => void;
      redo: () => void;
    };
  }
>;

export function withUndoRedo<Collection extends string>(
  options: {
    maxStackSize?: number;
    collections?: Collection[];
  } = {}
): // eslint-disable-next-line @typescript-eslint/no-explicit-any
SignalStoreFeature<any, any> {
  let previous: StackItem | null = null;
  let skipOnce = false;

  const normalized = {
    ...defaultOptions,
    ...options,
  };

  //
  // Design Decision: This feature has its own
  // internal state.
  //

  const undoStack: StackItem[] = [];
  const redoStack: StackItem[] = [];

  const canUndo = signal(false);
  const canRedo = signal(false);

  const updateInternal = () => {
    canUndo.set(undoStack.length !== 0);
    canRedo.set(redoStack.length !== 0);
  };

  const keys = getUndoRedoKeys(normalized?.collections);

  return signalStoreFeature(
    withComputed(() => ({
      canUndo: canUndo.asReadonly(),
      canRedo: canRedo.asReadonly(),
    })),
    withMethods((store) => ({
      undo(): void {
        const item = undoStack.pop();

        if (item && previous) {
          redoStack.push(previous);
        }

        if (item) {
          skipOnce = true;
          patchState(store, item);
          previous = item;
        }

        updateInternal();
      },
      redo(): void {
        const item = redoStack.pop();

        if (item && previous) {
          undoStack.push(previous);
        }

        if (item) {
          skipOnce = true;
          patchState(store, item);
          previous = item;
        }

        updateInternal();
      },
    })),
    withHooks({
      onInit(store: Record<string, unknown>) {
        effect(() => {
          const cand = keys.reduce((acc, key) => {
            const s = store[key];
            if (s && isSignal(s)) {
              return {
                ...acc,
                [key]: s(),
              };
            }
            return acc;
          }, {});

          if (skipOnce) {
            skipOnce = false;
            return;
          }

          //
          // Deep Comparison to prevent duplicated entries
          // on the stack. This can e.g. happen after an undo
          // if the component sends back the undone filter
          // to the store.
          //
          if (JSON.stringify(cand) === JSON.stringify(previous)) {
            return;
          }

          // Clear redoStack after recorded action
          redoStack.splice(0);

          if (previous) {
            undoStack.push(previous);
          }

          if (redoStack.length > normalized.maxStackSize) {
            undoStack.unshift();
          }

          previous = cand;

          // Don't propogate current reactive context
          untracked(() => updateInternal());
        });
      },
    })
  );
}
