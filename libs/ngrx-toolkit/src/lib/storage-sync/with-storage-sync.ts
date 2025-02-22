import { isPlatformServer } from '@angular/common';
import {
  effect,
  EnvironmentInjector,
  inject,
  PLATFORM_ID,
  runInInjectionContext,
  Type,
} from '@angular/core';
import {
  getState,
  patchState,
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import {
  IndexeddbService,
  StorageService,
  StorageServiceFactory,
  WithIndexeddbSyncFeatureResult,
  WithStorageSyncFeatureResult,
} from './internal/models';
import { withIndexeddb } from './features/with-indexeddb';

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
   * Function used to transform the state into a string representation.
   *
   * `JSON.stringify()` by default
   */
  stringify?: (state: State) => string;
};

/**
 * Enables store synchronization with storage.
 *
 * Only works on browser platform.
 */

// only key
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;

// key + indexeddb
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string,
  StorageServiceClass: Type<IndexeddbService>
): SignalStoreFeature<Input, WithIndexeddbSyncFeatureResult>;

// key + localStorage(or sessionStorage)
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string,
  StorageServiceClass: Type<StorageService>
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;

// config + localStorage
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;

// config + indexeddb
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>,
  StorageServiceClass: Type<IndexeddbService>
): SignalStoreFeature<Input, WithIndexeddbSyncFeatureResult>;

// config + localStorage(or sessionStorage)
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>,
  StorageServiceClass: Type<StorageService>
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;

export function withStorageSync<
  State extends object,
  Input extends SignalStoreFeatureResult
>(
  configOrKey: SyncConfig<Input['state']> | string,
  StorageServiceClass: StorageServiceFactory = withIndexeddb()
): SignalStoreFeature<
  Input,
  WithStorageSyncFeatureResult | WithIndexeddbSyncFeatureResult
> {
  const {
    key,
    autoSync = true,
    select = (state: State) => state,
    parse = JSON.parse,
    stringify = JSON.stringify,
  } = typeof configOrKey === 'string' ? { key: configOrKey } : configOrKey;

  return signalStoreFeature(
    withMethods(
      (
        store,
        platformId = inject(PLATFORM_ID),
        storageService = inject(StorageServiceClass)
      ) => {
        if (isPlatformServer(platformId)) {
          return storageService.getStub();
        }

        return {
          /**
           * Removes the item stored in storage.
           */
          async clearStorage(): Promise<void> {
            await storageService.clear(key);
          },
          /**
           * Reads item from storage and patches the state.
           */
          async readFromStorage(): Promise<void> {
            const stateString = await storageService.getItem(key);

            if (stateString) {
              patchState(store, parse(stateString));
            }
          },
          /**
           * Writes selected portion to storage.
           */
          async writeToStorage(): Promise<void> {
            const slicedState = select(getState(store) as State);
            await storageService.setItem(key, stringify(slicedState));
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
