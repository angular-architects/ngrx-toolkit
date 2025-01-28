import { isPlatformServer } from '@angular/common';
import {
  PLATFORM_ID,
  effect,
  inject,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import {
  SignalStoreFeature,
  getState,
  patchState,
  signalStoreFeature,
  withHooks,
  withMethods,
  SignalStoreFeatureResult,
  EmptyFeatureResult,
} from '@ngrx/signals';
import { StorageService } from './internal/storage.service';

const NOOP = () => Promise.resolve();

type WithStorageSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    clearStorage(): Promise<void>;
    readFromStorage(): Promise<void>;
    writeToStorage(): Promise<void>;
  };
};

const StorageSyncStub: Pick<
  WithStorageSyncFeatureResult,
  'methods'
>['methods'] = {
  clearStorage: NOOP,
  readFromStorage: NOOP,
  writeToStorage: NOOP,
};

export type SyncConfig<State> = {
  /**
   * The key which is used to access the storage.
   */
  key: string;
  /**
   * Flag indicating if the store should read from storage on init and write to storage on every state change.
   *
   * `true` by default
   */
  autoSync?: boolean;
  /**
   * Function to select that portion of the state which should be stored.
   *
   * Returns the whole state object by default
   */
  select?: (state: State) => Partial<State>;
  /**
   * Function used to parse the state coming from storage.
   *
   * `JSON.parse()` by default
   */
  parse?: (stateString: string) => State;
  /**
   * Function used to tranform the state into a string representation.
   *
   * `JSON.stringify()` by default
   */
  stringify?: (state: State) => string;
  /**
   * Allows selection between localStorage, sessionStorage, and indexedDB
   *
   * Defaults to `localStorage`
   */
  storage?: 'localStorage' | 'sessionStorage';
};

export type IndexedDBSyncConfig<State> = {
  /**
   * Allows selection between localStorage, sessionStorage, and indexedDB
   *
   */
  storage: 'indexedDB';

  /**
   * The name of the indexedDB database
   */
  dbName: string;

  /**
   * The store name in indexedDB (equivalent to a table name in SQL)
   */
  storeName: string;
  /**
   * Flag indicating if the store should read from storage on init and write to storage on every state change.
   *
   * `true` by default
   */
  autoSync?: boolean;
  /**
   * Function to select that portion of the state which should be stored.
   *
   * Returns the whole state object by default
   */
  select?: (state: State) => Partial<State>;
  /**
   * Function used to parse the state coming from storage.
   *
   * `JSON.parse()` by default
   */
  parse?: (stateString: string) => State;
  /**
   * Function used to tranform the state into a string representation.
   *
   * `JSON.stringify()` by default
   */
  stringify?: (state: State) => string;
};

export type Config<State> = SyncConfig<State> | IndexedDBSyncConfig<State>;

/**
 * Enables store synchronization with storage.
 *
 * Only works on browser platform.
 */
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: Config<Input['state']>
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;
export function withStorageSync<
  State extends object,
  Input extends SignalStoreFeatureResult
>(
  configOrKey: string | Config<State>
): SignalStoreFeature<Input, WithStorageSyncFeatureResult> {
  const {
    autoSync = true,
    select = (state: State) => state,
    parse = JSON.parse,
    stringify = JSON.stringify,
    storage = 'localStorage',
  } = typeof configOrKey === 'string' ? {} : configOrKey;

  const key =
    typeof configOrKey === 'string'
      ? configOrKey
      : configOrKey.storage === 'indexedDB'
      ? ''
      : configOrKey.key;

  const dbName =
    typeof configOrKey !== 'string' && configOrKey.storage === 'indexedDB'
      ? configOrKey.dbName
      : '';

  const storeName =
    typeof configOrKey !== 'string' && configOrKey.storage === 'indexedDB'
      ? configOrKey.storeName
      : '';

  return signalStoreFeature(
    withMethods(
      (
        store,
        platformId = inject(PLATFORM_ID),
        storageService = inject(StorageService)
      ) => {
        if (isPlatformServer(platformId)) {
          console.warn(
            `'withStorageSync' provides non-functional implementation due to server-side execution`
          );
          return StorageSyncStub;
        }

        return {
          /**
           * Removes the item stored in storage.
           */
          async clearStorage(): Promise<void> {
            await storageService.removeItem({
              storage,
              key,
              dbName,
              storeName,
            });
          },
          /**
           * Reads item from storage and patches the state.
           */
          async readFromStorage(): Promise<void> {
            const stateString = await storageService.getItem({
              storage,
              key,
              dbName,
              storeName,
            });
            if (stateString) {
              patchState(store, parse(stateString));
            }
          },
          /**
           * Writes selected portion to storage.
           */
          async writeToStorage(): Promise<void> {
            const slicedState = select(getState(store) as State);
            await storageService.setItem(
              { storage, key, dbName: dbName, storeName: storeName },
              stringify(slicedState)
            );
          },
        };
      }
    ),
    withHooks({
      onInit(
        store,
        platformId = inject(PLATFORM_ID),
        envInjector = inject(EnvironmentInjector),
        storageService = inject(StorageService)
      ) {
        if (isPlatformServer(platformId)) {
          return;
        }

        if (typeof configOrKey === 'string') {
          storageService.setStorage(localStorage);
        }

        if (storage === 'localStorage' || storage === 'sessionStorage') {
          storageService.setStorage(window[storage]);
        }

        if (autoSync) {
          store.readFromStorage().then(() => {
            Promise.resolve().then(async () => {
              runInInjectionContext(envInjector, () => {
                effect(() => {
                  store.writeToStorage();
                });
              });
            });
          });
        }
      },
    })
  );
}
