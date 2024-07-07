import { ProviderToken, Signal, computed, inject } from '@angular/core';
import {
  SignalStoreFeature,
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
  StateSignal,
} from '@ngrx/signals';
import {
  CallState,
  getCallStateKeys,
  setError,
  setLoaded,
  setLoading,
} from './with-call-state';
import {
  setAllEntities,
  EntityId,
  addEntity,
  updateEntity,
  removeEntity,
} from '@ngrx/signals/entities';
import { EntityState, NamedEntityComputed } from './shared/signal-store-models';

export type Filter = Record<string, unknown>;
export type Entity = { id: EntityId };

export interface DataService<E extends Entity, F extends Filter> {
  load(filter: F): Promise<E[]>;

  loadById(id: EntityId): Promise<E>;

  create(entity: E): Promise<E>;

  update(entity: E): Promise<E>;

  updateAll(entity: E[]): Promise<E[]>;

  delete(entity: E): Promise<void>;
}

export function capitalize(str: string): string {
  return str ? str[0].toUpperCase() + str.substring(1) : str;
}

export function getDataServiceKeys(options: { collection?: string }) {
  const filterKey = options.collection
    ? `${options.collection}Filter`
    : 'filter';
  const selectedIdsKey = options.collection
    ? `selected${capitalize(options.collection)}Ids`
    : 'selectedIds';
  const selectedEntitiesKey = options.collection
    ? `selected${capitalize(options.collection)}Entities`
    : 'selectedEntities';

  const updateFilterKey = options.collection
    ? `update${capitalize(options.collection)}Filter`
    : 'updateFilter';
  const updateSelectedKey = options.collection
    ? `updateSelected${capitalize(options.collection)}Entities`
    : 'updateSelected';
  const loadKey = options.collection
    ? `load${capitalize(options.collection)}Entities`
    : 'load';

  const currentKey = options.collection
    ? `current${capitalize(options.collection)}`
    : 'current';
  const loadByIdKey = options.collection
    ? `load${capitalize(options.collection)}ById`
    : 'loadById';
  const setCurrentKey = options.collection
    ? `setCurrent${capitalize(options.collection)}`
    : 'setCurrent';
  const createKey = options.collection
    ? `create${capitalize(options.collection)}`
    : 'create';
  const updateKey = options.collection
    ? `update${capitalize(options.collection)}`
    : 'update';
  const updateAllKey = options.collection
    ? `updateAll${capitalize(options.collection)}`
    : 'updateAll';
  const deleteKey = options.collection
    ? `delete${capitalize(options.collection)}`
    : 'delete';

  // TODO: Take these from @ngrx/signals/entities, when they are exported
  const entitiesKey = options.collection
    ? `${options.collection}Entities`
    : 'entities';
  const entityMapKey = options.collection
    ? `${options.collection}EntityMap`
    : 'entityMap';
  const idsKey = options.collection ? `${options.collection}Ids` : 'ids';

  return {
    filterKey,
    selectedIdsKey,
    selectedEntitiesKey,
    updateFilterKey,
    updateSelectedKey,
    loadKey,
    entitiesKey,
    entityMapKey,
    idsKey,

    currentKey,
    loadByIdKey,
    setCurrentKey,
    createKey,
    updateKey,
    updateAllKey,
    deleteKey,
  };
}

export type NamedDataServiceState<
  E extends Entity,
  F extends Filter,
  Collection extends string
> = {
  [K in Collection as `${K}Filter`]: F;
} & {
  [K in Collection as `selected${Capitalize<K>}Ids`]: Record<EntityId, boolean>;
} & {
  [K in Collection as `current${Capitalize<K>}`]: E;
};

export type DataServiceState<E extends Entity, F extends Filter> = {
  filter: F;
  selectedIds: Record<EntityId, boolean>;
  current: E;
};

export type DataServiceComputed<E extends Entity> = {
  selectedEntities: Signal<E[]>;
};

export type NamedDataServiceComputed<
  E extends Entity,
  Collection extends string
> = {
  [K in Collection as `selected${Capitalize<K>}Entities`]: Signal<E[]>;
};

export type NamedDataServiceMethods<
  E extends Entity,
  F extends Filter,
  Collection extends string
> = {
  [K in Collection as `update${Capitalize<K>}Filter`]: (filter: F) => void;
} & {
  [K in Collection as `updateSelected${Capitalize<K>}Entities`]: (
    id: EntityId,
    selected: boolean
  ) => void;
} & {
  [K in Collection as `load${Capitalize<K>}Entities`]: () => Promise<void>;
} & {
  [K in Collection as `setCurrent${Capitalize<K>}`]: (entity: E) => void;
} & {
  [K in Collection as `load${Capitalize<K>}ById`]: (
    id: EntityId
  ) => Promise<void>;
} & {
  [K in Collection as `create${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in Collection as `update${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in Collection as `updateAll${Capitalize<K>}`]: (
    entity: E[]
  ) => Promise<void>;
} & {
  [K in Collection as `delete${Capitalize<K>}`]: (entity: E) => Promise<void>;
};

export type DataServiceMethods<E extends Entity, F extends Filter> = {
  updateFilter: (filter: F) => void;
  updateSelected: (id: EntityId, selected: boolean) => void;
  load: () => Promise<void>;

  setCurrent(entity: E): void;
  loadById(id: EntityId): Promise<void>;
  create(entity: E): Promise<void>;
  update(entity: E): Promise<void>;
  updateAll(entities: E[]): Promise<void>;
  delete(entity: E): Promise<void>;
};

export type Empty = Record<string, never>;

export function withDataService<
  E extends Entity,
  F extends Filter,
  Collection extends string
>(options: {
  dataServiceType: ProviderToken<DataService<E, F>>;
  filter: F;
  collection: Collection;
}): SignalStoreFeature<
  {
    state: {};
    // These alternatives break type inference:
    // state: { callState: CallState } & NamedEntityState<E, Collection>,
    // state: NamedEntityState<E, Collection>,

    computed: NamedEntityComputed<E, Collection>;
    methods: {};
  },
  {
    state: NamedDataServiceState<E, F, Collection>;
    computed: NamedDataServiceComputed<E, Collection>;
    methods: NamedDataServiceMethods<E, F, Collection>;
  }
>;
export function withDataService<E extends Entity, F extends Filter>(options: {
  dataServiceType: ProviderToken<DataService<E, F>>;
  filter: F;
}): SignalStoreFeature<
  {
    state: { callState: CallState } & EntityState<E>;
    computed: {};
    methods: {};
  },
  {
    state: DataServiceState<E, F>;
    computed: DataServiceComputed<E>;
    methods: DataServiceMethods<E, F>;
  }
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withDataService<
  E extends Entity,
  F extends Filter,
  Collection extends string
>(options: {
  dataServiceType: ProviderToken<DataService<E, F>>;
  filter: F;
  collection?: Collection;
}): SignalStoreFeature<any, any> {
  const { dataServiceType, filter, collection: prefix } = options;
  const {
    entitiesKey,
    filterKey,
    loadKey,
    selectedEntitiesKey,
    selectedIdsKey,
    updateFilterKey,
    updateSelectedKey,

    currentKey,
    createKey,
    updateKey,
    updateAllKey,
    deleteKey,
    loadByIdKey,
    setCurrentKey,
  } = getDataServiceKeys(options);

  const { callStateKey } = getCallStateKeys({ collection: prefix });

  return signalStoreFeature(
    withState(() => ({
      [filterKey]: filter,
      [selectedIdsKey]: {} as Record<EntityId, boolean>,
      [currentKey]: undefined as E | undefined,
    })),
    withComputed((store: Record<string, unknown>) => {
      const entities = store[entitiesKey] as Signal<E[]>;
      const selectedIds = store[selectedIdsKey] as Signal<
        Record<EntityId, boolean>
      >;

      return {
        [selectedEntitiesKey]: computed(() =>
          entities().filter((e) => selectedIds()[e.id])
        ),
      };
    }),
    withMethods((store: Record<string, unknown> & StateSignal<object>) => {
      const dataService = inject(dataServiceType);
      return {
        [updateFilterKey]: (filter: F): void => {
          patchState(store, { [filterKey]: filter });
        },
        [updateSelectedKey]: (id: EntityId, selected: boolean): void => {
          patchState(store, (state: Record<string, unknown>) => ({
            [selectedIdsKey]: {
              ...(state[selectedIdsKey] as Record<EntityId, boolean>),
              [id]: selected,
            },
          }));
        },
        [loadKey]: async (): Promise<void> => {
          const filter = store[filterKey] as Signal<F>;
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const result = await dataService.load(filter());
            patchState(
              store,
              prefix
                ? setAllEntities(result, { collection: prefix })
                : setAllEntities(result)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [loadByIdKey]: async (id: EntityId): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const current = await dataService.loadById(id);
            store[callStateKey] && patchState(store, setLoaded(prefix));
            patchState(store, { [currentKey]: current });
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [setCurrentKey]: (current: E): void => {
          patchState(store, { [currentKey]: current });
        },
        [createKey]: async (entity: E): Promise<void> => {
          patchState(store, { [currentKey]: entity });
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const created = await dataService.create(entity);
            patchState(store, { [currentKey]: created });
            patchState(
              store,
              prefix
                ? addEntity(created, { collection: prefix })
                : addEntity(created)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [updateKey]: async (entity: E): Promise<void> => {
          patchState(store, { [currentKey]: entity });
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const updated = await dataService.update(entity);
            patchState(store, { [currentKey]: updated });

            const updateArg = {
              id: updated.id,
              changes: updated,
            };

            const updater = (collection: string) =>
              updateEntity(updateArg, { collection });

            patchState(
              store,
              prefix ? updater(prefix) : updateEntity(updateArg)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [updateAllKey]: async (entities: E[]): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const result = await dataService.updateAll(entities);
            patchState(
              store,
              prefix
                ? setAllEntities(result, { collection: prefix })
                : setAllEntities(result)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [deleteKey]: async (entity: E): Promise<void> => {
          patchState(store, { [currentKey]: entity });
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            await dataService.delete(entity);
            patchState(store, { [currentKey]: undefined });
            patchState(
              store,
              prefix
                ? removeEntity(entity.id, { collection: prefix })
                : removeEntity(entity.id)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
      };
    })
  );
}
