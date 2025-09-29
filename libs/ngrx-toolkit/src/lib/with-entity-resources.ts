import { ResourceRef, Signal, computed, linkedSignal } from '@angular/core';
import {
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
  signalStoreFeature,
  withComputed,
  withLinkedState,
} from '@ngrx/signals';
import {
  EntityId,
  EntityProps,
  EntityState,
  NamedEntityProps,
  NamedEntityState,
} from '@ngrx/signals/entities';
import {
  NamedResourceResult,
  ResourceResult,
  isResourceRef,
  withResource,
} from './with-resource';

/**
 * @experimental
 * @description
 *
 * Integrates array-based `Resource` data into Entity-style state for NgRx SignalStore.
 *
 * - For a single (unnamed) resource: exposes `value`, `status`, `error`, `isLoading`
 *   from the underlying resource (via `withResource`), and derives
 *   `ids`, `entityMap`, and `entities` via `withLinkedState`/`withComputed`.
 * - For multiple (named) resources: registers each resource by name and exposes
 *   the same members prefixed with the resource name, e.g. `todosIds`,
 *   `todosEntityMap`, `todosEntities`, along with `todosValue`, `todosStatus`, etc.
 *
 * No effects are used. All derived signals are linked to the resource's value
 * through `withLinkedState`, so entity updaters such as `addEntity`, `updateEntity`,
 * and `removeEntity` mutate the store's entity view without directly writing to the
 * resource. The source of truth remains the resource value.
 *
 * @usageNotes
 *
 * Unnamed resource example:
 *
 * ```ts
 * type Todo = { id: number; title: string; completed: boolean };
 *
 * const Store = signalStore(
 *   { providedIn: 'root' },
 *   withEntityResources(() =>
 *     resource({ loader: () => Promise.resolve([] as Todo[]), defaultValue: [] }),
 *   ),
 * );
 *
 * const store = TestBed.inject(Store);
 * store.status();    // 'idle' | 'loading' | 'resolved' | 'error'
 * store.value();     // Todo[]
 * store.ids();       // EntityId[]
 * store.entityMap(); // Record<EntityId, Todo>
 * store.entities();  // Todo[]
 *
 * // Works with @ngrx/signals/entities updaters
 * patchState(store, addEntity({ id: 1, title: 'X', completed: false }));
 * ```
 *
 * Named resources example:
 *
 * ```ts
 * const Store = signalStore(
 *   { providedIn: 'root' },
 *   withEntityResources(() => ({
 *     todos: resource({ loader: () => Promise.resolve([] as Todo[]), defaultValue: [] }),
 *     projects: resource({ loader: () => Promise.resolve([] as { id: number; name: string }[]), defaultValue: [] }),
 *   })),
 * );
 *
 * const store = TestBed.inject(Store);
 * store.todosValue();
 * store.todosIds();
 * store.todosEntityMap();
 * store.todosEntities();
 * patchState(store, addEntity({ id: 2, title: 'Y', completed: true }, { collection: 'todos' }));
 * ```
 */
export function withEntityResources<
  Input extends SignalStoreFeatureResult,
  Entity extends { id: EntityId },
>(
  resourceFactory: (
    store: Input['props'] & Input['methods'] & StateSignals<Input['state']>,
  ) => ResourceRef<readonly Entity[] | Entity[] | undefined>,
): SignalStoreFeature<Input, EntityResourceResult<Entity>>;

export function withEntityResources<
  Input extends SignalStoreFeatureResult,
  Dictionary extends EntityDictionary,
>(
  resourceFactory: (
    store: Input['props'] & Input['methods'] & StateSignals<Input['state']>,
  ) => Dictionary,
): SignalStoreFeature<Input, NamedEntityResourceResult<Dictionary>>;

export function withEntityResources<
  Input extends SignalStoreFeatureResult,
  ResourceValue extends readonly unknown[] | unknown[] | undefined,
>(
  entityResourceFactory: (
    store: Input['props'] & Input['methods'] & StateSignals<Input['state']>,
  ) => ResourceRef<ResourceValue> | EntityDictionary,
): SignalStoreFeature<Input> {
  return (store) => {
    const resourceOrDict = entityResourceFactory({
      ...store.stateSignals,
      ...store.props,
      ...store.methods,
    });

    if (isResourceRef(resourceOrDict)) {
      return createUnnamedEntityResource(resourceOrDict)(store);
    }
    return createNamedEntityResources(resourceOrDict)(store);
  };
}

function createUnnamedEntityResource<
  R extends ResourceRef<readonly unknown[] | unknown[] | undefined>,
>(resource: R) {
  type E = InferEntityFromRef<R> & { id: EntityId };
  const { idsLinked, entityMapLinked, entitiesSignal } =
    createEntityDerivations<E>(
      resource.value as Signal<readonly E[] | E[] | undefined>,
    );

  return signalStoreFeature(
    withResource(() => resource),
    withLinkedState(() => ({
      entityMap: entityMapLinked,
      ids: idsLinked,
    })),
    withComputed(() => ({
      entities: entitiesSignal,
    })),
  );
}

function createNamedEntityResources<Dictionary extends EntityDictionary>(
  dictionary: Dictionary,
) {
  const keys = Object.keys(dictionary);

  const linkedState: Record<string, Signal<unknown>> = {};
  const computedProps: Record<string, Signal<unknown>> = {};

  keys.forEach((name) => {
    const ref = dictionary[name];
    type E = InferEntityFromRef<typeof ref> & { id: EntityId };
    const { idsLinked, entityMapLinked, entitiesSignal } =
      createEntityDerivations<E>(
        ref.value as Signal<readonly E[] | E[] | undefined>,
      );

    linkedState[`${String(name)}EntityMap`] = entityMapLinked;
    linkedState[`${String(name)}Ids`] = idsLinked;
    computedProps[`${String(name)}Entities`] = entitiesSignal;
  });

  return signalStoreFeature(
    withResource(() => dictionary),
    withLinkedState(() => linkedState),
    withComputed(() => computedProps),
  );
}

// Types for `withEntityResources`
/**
 * @internal
 * @description
 *
 * Type composition notes: we intentionally do not duplicate or re-declare
 * types that already exist in `@ngrx/signals/entities` or in this library's
 * `with-resource` feature. Instead, we compose the resulting API via
 * intersections of those public contracts.
 *
 * Rationale:
 * - Keeps our types in sync with upstream sources and avoids drift.
 * - Reduces maintenance overhead and duplication.
 * - Ensures consumers benefit automatically from upstream typing fixes.
 *
 * Concretely:
 * - For unnamed resources we return `ResourceResult<Entity>` intersected with
 *   `EntityState<Entity>` and `EntityProps<Entity>`.
 * - For named resources we return `NamedResourceResult<T>` intersected with
 *   `NamedEntityState<E, Name>` and `NamedEntityProps<E, Name>` for each entry.
 */
export type EntityResourceResult<Entity> = {
  state: ResourceResult<Entity>['state'] & EntityState<Entity>;
  props: ResourceResult<Entity>['props'] & EntityProps<Entity>;
  methods: ResourceResult<Entity>['methods'];
};

// Generic helpers for inferring entity types and merging unions
type ArrayElement<T> = T extends readonly (infer E)[] | (infer E)[] ? E : never;

type InferEntityFromSignal<T> =
  T extends Signal<infer V> ? ArrayElement<V> : never;

type InferEntityFromRef<
  R extends ResourceRef<readonly unknown[] | unknown[] | undefined>,
> = R['value'] extends Signal<infer V> ? ArrayElement<V> : never;

type MergeUnion<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export type EntityDictionary = Record<
  string,
  ResourceRef<readonly unknown[] | unknown[] | undefined>
>;

type MergeNamedEntityStates<T extends EntityDictionary> = MergeUnion<
  {
    [Prop in keyof T]: Prop extends string
      ? InferEntityFromSignal<T[Prop]['value']> extends infer E
        ? E extends never
          ? never
          : NamedEntityState<E, Prop>
        : never
      : never;
  }[keyof T]
>;

type MergeNamedEntityProps<T extends EntityDictionary> = MergeUnion<
  {
    [Prop in keyof T]: Prop extends string
      ? InferEntityFromSignal<T[Prop]['value']> extends infer E
        ? E extends never
          ? never
          : NamedEntityProps<E, Prop>
        : never
      : never;
  }[keyof T]
>;

export type NamedEntityResourceResult<T extends EntityDictionary> = {
  state: NamedResourceResult<T>['state'] & MergeNamedEntityStates<T>;
  props: NamedResourceResult<T>['props'] & MergeNamedEntityProps<T>;
  methods: NamedResourceResult<T>['methods'];
};

/**
 * @internal
 * @description
 *
 * Creates the three entity-related signals (`ids`, `entityMap`, `entities`) from
 * a single source signal of entities. This mirrors the public contract of
 * `withEntities()`:
 * - `ids`: derived list of entity ids
 * - `entityMap`: map of id -> entity
 * - `entities`: projection of `ids` through `entityMap`
 *
 * Implementation details:
 * - Uses `withLinkedState` + `linkedSignal` for `ids` and `entityMap` so they are
 *   writable state signals in the store (updaters like `addEntity` can mutate them).
 * - `entities` is a pure `computed` derived from `ids` and `entityMap`, matching
 *   the pattern in `withEntities` where `entities` is computed from the two bases.
 *
 * Why not `watchState` or `effect`?
 * - `watchState` would fire for any state change in the store, not just changes
 *   to the underlying resource value. That would cause unnecessary recomputation
 *   and make it harder to reason about updates.
 * - `effect` would introduce side-effects and lifecycle management for syncing,
 *   which is heavier and not aligned with this feature's goal to be purely
 *   derived from signals. Using linked signals keeps the data flow declarative
 *   and avoids imperative syncing code.
 */
function createEntityDerivations<E extends { id: EntityId }>(
  source: Signal<readonly E[] | E[] | undefined>,
) {
  const idsLinked = linkedSignal({
    source,
    computation: (list) => (list ?? []).map((e) => e.id),
  });

  const entityMapLinked = linkedSignal({
    source,
    computation: (list) => {
      const map = {} as Record<EntityId, E>;
      for (const item of list ?? []) {
        map[item.id] = item as E;
      }
      return map;
    },
  });

  const entitiesSignal = computed(() => {
    const ids = idsLinked();
    const map = entityMapLinked();
    return ids.map((id) => map[id]) as readonly E[];
  });

  return { idsLinked, entityMapLinked, entitiesSignal };
}
