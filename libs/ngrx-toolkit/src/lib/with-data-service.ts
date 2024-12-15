import { ProviderToken, Signal, computed, inject } from '@angular/core';
import {HttpErrorResponse} from "@angular/common/http";
import {
  SignalStoreFeature,
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
  EmptyFeatureResult,
  WritableStateSource,
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
import {tapResponse} from "@ngrx/operators";
import { Observable, isObservable, Subscription } from 'rxjs';
import { EntityState, NamedEntityComputed } from './shared/signal-store-models';

export type Filter = Record<string, unknown>;
export type Entity = { id: EntityId };

// For interface
type PromiseOrObservable<Entity> = Promise<Entity> | Observable<Entity>;
// For methods
// TODO - will likely be an unsubscription after working these things out - the unsub strategy is outstanding for now
type PromiseOrSubscription<Entity> = Promise<Entity> | Subscription;

export interface DataService<
  E extends Entity,
  F extends Filter>
{
  load(filter: F): PromiseOrObservable<Entity[]>;

  loadById(id: EntityId): PromiseOrObservable<Entity>;

  create(entity: E): PromiseOrObservable<Entity>;

  update(entity: E): PromiseOrObservable<Entity>;

  updateAll(entity: E[]): PromiseOrObservable<Entity[]>;

  delete(entity: E): PromiseOrObservable<void> ;
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
  [K in Collection as `load${Capitalize<K>}Entities`]: () => PromiseOrSubscription<void>;
} & {
  [K in Collection as `setCurrent${Capitalize<K>}`]: (entity: E) => void;
} & {
  [K in Collection as `load${Capitalize<K>}ById`]: (
    id: EntityId
  ) => PromiseOrSubscription<void>;
} & {
  [K in Collection as `create${Capitalize<K>}`]: (entity: E) => PromiseOrSubscription<void>;
} & {
  [K in Collection as `update${Capitalize<K>}`]: (entity: E) => PromiseOrSubscription<void>;
} & {
  [K in Collection as `updateAll${Capitalize<K>}`]: (
    entity: E[]
  ) => PromiseOrSubscription<void>;
} & {
  [K in Collection as `delete${Capitalize<K>}`]: (entity: E) => PromiseOrSubscription<void>;
};

export type DataServiceMethods<E extends Entity, F extends Filter> = {
  updateFilter: (filter: F) => void;
  updateSelected: (id: EntityId, selected: boolean) => void;
  load: () => PromiseOrSubscription<void>;

  setCurrent(entity: E): void;
  loadById(id: EntityId): PromiseOrSubscription<void>;
  create(entity: E): PromiseOrSubscription<void>;
  update(entity: E): PromiseOrSubscription<void>;
  updateAll(entities: E[]): PromiseOrSubscription<void>;
  delete(entity: E): PromiseOrSubscription<void>;
};

export function withDataService<
  E extends Entity,
  F extends Filter,
  Collection extends string
>(options: {
  dataServiceType: ProviderToken<DataService<E, F>>;
  filter: F;
  collection: Collection;
}): SignalStoreFeature<
  // These alternatives break type inference:
  // state: { callState: CallState } & NamedEntityState<E, Collection>,
  // state: NamedEntityState<E, Collection>,
  EmptyFeatureResult & { computed: NamedEntityComputed<E, Collection> },
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
  EmptyFeatureResult & { state: { callState: CallState } & EntityState<E> },
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
    withMethods(
      (store: Record<string, unknown> & WritableStateSource<object>) => {
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
          [loadKey]: (): PromiseOrSubscription<void> => {
            const filter = store[filterKey] as Signal<F>;
            store[callStateKey] && patchState(store, setLoading(prefix));

            const serviceCall = dataService.load(filter());

            if (isObservable(serviceCall)) {
              return serviceCall.pipe(
                tapResponse((result) => {
                  patchState(
                    store,
                    prefix
                      ? setAllEntities(result, { collection: prefix })
                      : setAllEntities(result));
                  store[callStateKey] && patchState(store, setLoaded(prefix));
                }, (errorResponse: HttpErrorResponse) => store[callStateKey] && patchState(store, setError(errorResponse, prefix)))).subscribe();
            } else {
              const loadPromise = async () => {
                try {
                  const result = await serviceCall;
                  patchState(
                    store,
                    prefix
                      ? setAllEntities(result, { collection: prefix })
                      : setAllEntities(result));
                  store[callStateKey] && patchState(store, setLoaded(prefix));
                } catch (e) {
                  store[callStateKey] && patchState(store, setError(e, prefix));
                  throw e;
                }
              };
              return loadPromise();
            }
          },
          [loadByIdKey]: (id: EntityId): PromiseOrSubscription<void> => {
            store[callStateKey] && patchState(store, setLoading(prefix));

            const serviceCall = dataService.loadById(id);

            if (isObservable(serviceCall)) {
              return serviceCall.pipe(
                tapResponse(
                  (current) => {
                    store[callStateKey] && patchState(store, setLoaded(prefix));
                    patchState(store, { [currentKey]: current });
                  }, (errorResponse: HttpErrorResponse) => store[callStateKey] && patchState(store, setError(errorResponse, prefix))
                )
              ).subscribe()
            } else {
              const loadByIdPromise = async () => {
                try {
                  const current = await dataService.loadById(id);
                  store[callStateKey] && patchState(store, setLoaded(prefix));
                  patchState(store, { [currentKey]: current });
                } catch (e) {
                  store[callStateKey] && patchState(store, setError(e, prefix));
                  throw e;
                }
              }
              return loadByIdPromise()
            }

          },
          [setCurrentKey]: (current: E): void => {
            patchState(store, { [currentKey]: current });
          },
          [createKey]: (entity: E): PromiseOrSubscription<void> => {
            patchState(store, { [currentKey]: entity });
            store[callStateKey] && patchState(store, setLoading(prefix));

            const serviceCall = dataService.create(entity)

            if (isObservable(serviceCall)) {
              return serviceCall.pipe(
                tapResponse((created) => {
                  patchState(store, { [currentKey]: created });
                  patchState(
                    store,
                    prefix
                      ? addEntity(created, { collection: prefix })
                      : addEntity(created)
                  );
                  store[callStateKey] && patchState(store, setLoaded(prefix));
                }, (errorResponse: HttpErrorResponse) => store[callStateKey] && patchState(store, setError(errorResponse, prefix)))
              ).subscribe()
            } else {
              const createPromise = async () => {
                try {
                  const created = await serviceCall;
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
              }
              return createPromise()
            }
          },
          [updateKey]: (entity: E): PromiseOrSubscription<void> => {
            patchState(store, { [currentKey]: entity });
            store[callStateKey] && patchState(store, setLoading(prefix));

            const serviceCall = dataService.update(entity);

            if (isObservable(serviceCall)) {
              return serviceCall.pipe(
                tapResponse((updated) => {
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
                }, (error: HttpErrorResponse) => store[callStateKey] && patchState(store, setError(error, prefix)))
              ).subscribe()
            } else {
              const updatePromise = async() => {
                try {
                  const updated = await serviceCall;
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
              }
              return updatePromise()
            }
          },
          [updateAllKey]: (entities: E[]): PromiseOrSubscription<void> => {
            store[callStateKey] && patchState(store, setLoading(prefix));

            const serviceCall = dataService.updateAll(entities);

            if (isObservable(serviceCall)) {
              return serviceCall.pipe(
                tapResponse((result) => {
                  patchState(
                    store,
                    prefix
                      ? setAllEntities(result, { collection: prefix })
                      : setAllEntities(result)
                  );
                  store[callStateKey] && patchState(store, setLoaded(prefix));
                }, (error: HttpErrorResponse) => store[callStateKey] && patchState(store, setError(error, prefix)))
              ).subscribe()
            } else {
              const updateAllPromise = async() => {
                try {
                  const result = await serviceCall;
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
              }
              return updateAllPromise()
            }
          },
          [deleteKey]: (entity: E): PromiseOrSubscription<void> => {
            patchState(store, { [currentKey]: entity });
            store[callStateKey] && patchState(store, setLoading(prefix));

            const serviceCall = dataService.delete(entity)

            if (isObservable(serviceCall)) {
              return serviceCall.pipe(
                tapResponse(
                  (() => {
                    patchState(store, { [currentKey]: undefined });
                    patchState(
                      store,
                      prefix
                        ? removeEntity(entity.id, { collection: prefix })
                        : removeEntity(entity.id)
                    );
                    store[callStateKey] && patchState(store, setLoaded(prefix));
                  }),
                  (error: HttpErrorResponse) => store[callStateKey] && patchState(store, setError(error, prefix)),
                )
              ).subscribe()
            } else {
              const deletePromise = async() => {
                try {
                  await serviceCall;
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
              }
              return deletePromise()
            }
          },
        };
      }
    )
  );
}
