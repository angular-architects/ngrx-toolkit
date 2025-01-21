import {
  EmptyFeatureResult,
  getState,
  patchState,
  SignalStoreFeature,
  signalStoreFeature,
  SignalStoreFeatureResult,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import { SyncConfig } from './with-storage-sync';
import {
  effect,
  EnvironmentInjector,
  inject,
  PLATFORM_ID,
  runInInjectionContext,
} from '@angular/core';
import { IndexedDBService } from './internal/indexeddb.service';
import { isPlatformServer } from '@angular/common';

const PROMISE_NOOP = () => Promise.resolve();

export type WithIndexedDBSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    readFromIndexedDB(): Promise<void>;

    writeToIndexedDB(): Promise<void>;

    clearIndexedDB(): Promise<void>;
  };
};

const withIndexedDBSyncFeatureStub: Pick<
  WithIndexedDBSyncFeatureResult,
  'methods'
>['methods'] = {
  readFromIndexedDB: PROMISE_NOOP,
  writeToIndexedDB: PROMISE_NOOP,
  clearIndexedDB: PROMISE_NOOP,
};

export type WithIndexedDBFn<State extends object> = (
  indexedDBSyncConfig: IndexedDBSyncConfig<State>
) => SignalStoreFeature<EmptyFeatureResult, WithIndexedDBSyncFeatureResult>;

export type IndexedDBSyncConfig<State> = Omit<
  SyncConfig<State>,
  'storage' | 'key' | 'parse' | 'stringify'
> & {
  /**
   * indexeddb database name
   */
  dbName: string;

  /**
   * indexed db store name (like a table in SQL)
   */
  storeName: string;
};

/**
 * check if the object is IndexedDBSyncConfig
 */
export function isIndexedDBSyncConfig<Input extends SignalStoreFeatureResult>(
  obj: SyncConfig<Input['state']> | IndexedDBSyncConfig<Input['state']> | string
): obj is IndexedDBSyncConfig<Input['state']> {
  return typeof obj === 'object' && 'dbName' in obj && 'storeName' in obj;
}

/**
 * Enable store synchronization with IndexedDB
 * Only works on browser platform.
 */
export function withIndexedDB<State extends object>(): WithIndexedDBFn<State> {
  return (indexedDBSyncConfig: IndexedDBSyncConfig<State>) => {
    const {
      autoSync,
      dbName,
      storeName,
      select = (state: State) => state,
    } = indexedDBSyncConfig;

    return signalStoreFeature(
      withMethods(
        (
          store,
          platformId = inject(PLATFORM_ID),
          indexedDBService = inject(IndexedDBService)
        ) => {
          if (isPlatformServer(platformId)) {
            console.warn(
              `'withStorageSync' provides non-functional implementation due to server-side execution`
            );
            return withIndexedDBSyncFeatureStub;
          }

          return {
            async readFromIndexedDB(): Promise<void> {
              const dbState = (await indexedDBService.read(
                dbName,
                storeName
              )) as
                | {
                    keyPath: string;
                    value: State;
                  }
                | undefined;

              // do nothing if there is no value in db
              if (dbState === undefined) {
                return;
              }

              patchState(store, dbState.value);
            },

            async writeToIndexedDB(): Promise<void> {
              const state = select(getState(store) as State);

              await indexedDBService.write(dbName, storeName, state);
            },

            async clearIndexedDB(): Promise<void> {
              await indexedDBService.clear(dbName, storeName);
            },
          };
        }
      ),
      withHooks({
        onInit(
          store,
          platformId = inject(PLATFORM_ID),
          envInjector = inject(EnvironmentInjector)
        ) {
          if (isPlatformServer(platformId)) {
            console.warn(
              `'withStorageSync' provides non-functional implementation due to server-side execution`
            );
            return;
          }

          if (autoSync) return;

          store.readFromIndexedDB().then((_) => {
            runInInjectionContext(envInjector, () => {
              effect(() =>
                ((_state) => {
                  Promise.resolve().then(async () => {
                    await store.writeToIndexedDB();
                  });
                })(getState(store))
              );
            });
          });
        },
      })
    );
  };
}
