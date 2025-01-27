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
   * Factory function used to select the storage.
   *
   * `localstorage` by default
   */
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB';

  // todo description
  dbName: string;
  storeName: string;
};

/**
 * Enables store synchronization with storage.
 *
 * Only works on browser platform.
 */
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;
export function withStorageSync<
  State extends object,
  Input extends SignalStoreFeatureResult
>(
  configOrKey: string | SyncConfig<State>
): SignalStoreFeature<Input, WithStorageSyncFeatureResult> {
  const {
    key,
    autoSync = true,
    select = (state: State) => state,
    parse = JSON.parse,
    stringify = JSON.stringify,
    storage: storage = 'localStorage',
    dbName,
    storeName,
  } = typeof configOrKey === 'string' ? { key: configOrKey } : configOrKey;

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
            if (storage === 'indexedDB') {
              await storageService.removeItem({
                dbName: dbName,
                storeName: storeName,
              });
            } else {
              await storageService.removeItem(key);
            }
          },
          /**
           * Reads item from storage and patches the state.
           */
          async readFromStorage(): Promise<void> {
            const stateString =
              storage === 'indexedDB'
                ? await storageService.getItem({
                    dbName: dbName,
                    storeName: storeName,
                  })
                : await storageService.getItem(key);
            if (stateString) {
              patchState(store, parse(stateString));
            }
          },
          /**
           * Writes selected portion to storage.
           */
          async writeToStorage(): Promise<void> {
            const slicedState = select(getState(store) as State);
            if (storage === 'indexedDB') {
              await storageService.setItem(
                { dbName: dbName, storeName: storeName },
                stringify(slicedState)
              );
            } else {
              await storageService.setItem(key, stringify(slicedState));
            }
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

          effect(() => {
            store.writeToStorage();
          });
        }
      },
    })
  );
}
