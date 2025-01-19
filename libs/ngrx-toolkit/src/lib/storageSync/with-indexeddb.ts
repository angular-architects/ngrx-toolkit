import {
  EmptyFeatureResult,
  getState,
  patchState,
  signalStoreFeature,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import { SyncConfig } from './with-storage-sync';
import { effect, inject, PLATFORM_ID } from '@angular/core';
import { IndexedDBService } from './internal/indexeddb.service';
import { isPlatformServer } from '@angular/common';

type IndexedDBSyncConfig<State> = Omit<SyncConfig<State>, 'storage'>;

const PROMISE_NOOP = () => Promise.resolve();

type WithIndexedDBSyncFeatureResult = EmptyFeatureResult & {
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

/**
 * indexeddbを利用してデータを永続化させる関数
 * withStorageSyncの第二引数で使われる
 * @returns
 */
export function withIndexedDB<State extends object>() {
  const dbName = 'ngrx-toolkit';
  const storeName = 'ngrx-toolkit-store';

  return (config: IndexedDBSyncConfig<State>) => {
    return signalStoreFeature(
      withMethods(
        (
          store,
          platformId = inject(PLATFORM_ID),
          indexedDBService = inject(IndexedDBService)
        ) => {
          if (isPlatformServer(platformId)) {
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
              const state = getState(store) as State;

              await indexedDBService.write(dbName, storeName, state);
            },

            async clearIndexedDB(): Promise<void> {
              await indexedDBService.clear(dbName, storeName);
            },
          };
        }
      ),
      withHooks({
        onInit(store): void {
          if (config.autoSync) return;

          Promise.resolve().then(async () => {
            await store.readFromIndexedDB();
          });

          effect(() =>
            ((_) => {
              Promise.resolve().then(async () => {
                await store.writeToIndexedDB();
              });
            })(getState(store))
          );
        },
      })
    );
  };
}
