import { Signal, effect, isSignal, signal, untracked } from '@angular/core';
import {
  EmptyFeatureResult,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  patchState,
  signalStoreFeature,
  withComputed,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import { capitalize } from '../with-data-service';
import { ClearUndoRedoOptions } from './clear-undo-redo';

export type StackItem = Record<string, unknown>;

export type NormalizedUndoRedoOptions = {
  maxStackSize: number;
  collections?: string[];
  keys: string[];
  skip: number;
};

const defaultOptions: NormalizedUndoRedoOptions = {
  maxStackSize: 100,
  keys: [],
  skip: 0,
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

type NonNever<T> = T extends never ? never : T;

type ExtractEntityCollection<T> = T extends `${infer U}Entities` ? U : never;

type ExtractEntityCollections<Store extends SignalStoreFeatureResult> =
  NonNever<
    {
      [K in keyof Store['props']]: ExtractEntityCollection<K>;
    }[keyof Store['props']]
  >;

type OptionsForState<Store extends SignalStoreFeatureResult> = Partial<
  Omit<NormalizedUndoRedoOptions, 'collections' | 'keys'>
> & {
  collections?: ExtractEntityCollections<Store>[];
  keys?: (keyof Store['state'])[];
};

export function withUndoRedo<Input extends EmptyFeatureResult>(
  options?: OptionsForState<Input>,
): SignalStoreFeature<
  Input,
  EmptyFeatureResult & {
    props: {
      canUndo: Signal<boolean>;
      canRedo: Signal<boolean>;
    };
    methods: {
      undo: () => void;
      redo: () => void;
      /** @deprecated Use {@link clearUndoRedo} instead. */
      clearStack: () => void;
    };
  }
> {
  let lastRecord: StackItem | null = null;
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

  const keys = [...getUndoRedoKeys(normalized.collections), ...normalized.keys];

  return signalStoreFeature(
    withComputed(() => ({
      canUndo: canUndo.asReadonly(),
      canRedo: canRedo.asReadonly(),
    })),
    withMethods((store) => ({
      undo(): void {
        const item = undoStack.pop();

        if (item && lastRecord) {
          redoStack.push(lastRecord);
        }

        if (item) {
          skipOnce = true;
          patchState(store, item);
          lastRecord = item;
        }

        updateInternal();
      },
      redo(): void {
        const item = redoStack.pop();

        if (item && lastRecord) {
          undoStack.push(lastRecord);
        }

        if (item) {
          skipOnce = true;
          patchState(store, item);
          lastRecord = item;
        }

        updateInternal();
      },
      __clearUndoRedo__(opts?: ClearUndoRedoOptions<Input['state']>): void {
        undoStack.splice(0);
        redoStack.splice(0);

        if (opts) {
          lastRecord = opts.lastRecord;
        }

        updateInternal();
      },
    })),
    withMethods((store) => ({
      /** @deprecated Use {@link clearUndoRedo} instead. */
      clearStack(): void {
        store.__clearUndoRedo__();
      },
    })),
    withHooks({
      onInit(store) {
        effect(() => {
          const cand = keys.reduce((acc, key) => {
            const s = (store as Record<string | keyof Input['state'], unknown>)[
              key
            ];
            if (s && isSignal(s)) {
              return {
                ...acc,
                [key]: s(),
              };
            }
            return acc;
          }, {});

          if (normalized.skip > 0) {
            normalized.skip--;
            return;
          }

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
          if (JSON.stringify(cand) === JSON.stringify(lastRecord)) {
            return;
          }

          // Clear redoStack after recorded action
          redoStack.splice(0);

          if (lastRecord) {
            undoStack.push(lastRecord);
          }

          if (redoStack.length > normalized.maxStackSize) {
            undoStack.unshift();
          }

          lastRecord = cand;

          // Don't propogate current reactive context
          untracked(() => updateInternal());
        });
      },
    }),
  );
}
