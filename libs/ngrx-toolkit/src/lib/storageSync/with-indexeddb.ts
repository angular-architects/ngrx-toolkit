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

export type WithInexedDBFn<State extends object> = (
  indexedDBSyncConfig: IndexedDBSyncConfig<State>
) => SignalStoreFeature<EmptyFeatureResult, WithIndexedDBSyncFeatureResult>;

export type IndexedDBSyncConfig<State> = Omit<
  SyncConfig<State>,
  'storage' | 'key' | 'parse' | 'stringify'
> & {
  dbName: string;
  storeName: string;
};

export function isIndexedDBSyncConfig<Input extends SignalStoreFeatureResult>(
  obj: SyncConfig<Input['state']> | IndexedDBSyncConfig<Input['state']> | string
): obj is IndexedDBSyncConfig<Input['state']> {
  return typeof obj === 'object' && 'dbName' in obj;
}

/**
 * indexeddbを利用してデータを永続化させる関数
 * withStorageSyncの第二引数で使われる
 * @returns
 */
export function withIndexedDB<State extends object>(): WithInexedDBFn<State> {
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

              // en:do nothing if there is no value in db
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
