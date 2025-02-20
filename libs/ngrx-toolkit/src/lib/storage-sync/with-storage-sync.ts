import { isPlatformServer } from '@angular/common';
import {
  effect,
  EnvironmentInjector,
  inject,
  PLATFORM_ID,
  runInInjectionContext,
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
import { withLocalStorage } from './features/with-local-storage';
import {
  IndexedDBServiceFactory,
  LocalStorageServiceFactory,
  SessionStorageServiceFactory,
  StorageServiceFactory,
  WithIndexeddbStorageSyncFeatureResult,
  WithStorageSyncFeatureResult,
} from './internal/models';

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
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;

export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string,
  StorageServiceClass: LocalStorageServiceFactory | SessionStorageServiceFactory
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;

export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string,
  StorageServiceClass: IndexedDBServiceFactory
): SignalStoreFeature<Input, WithIndexeddbStorageSyncFeatureResult>;

export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;

export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>,
  StorageServiceClass: LocalStorageServiceFactory | SessionStorageServiceFactory
): SignalStoreFeature<Input, WithStorageSyncFeatureResult>;

export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>,
  StorageServiceClass: IndexedDBServiceFactory
): SignalStoreFeature<Input, WithIndexeddbStorageSyncFeatureResult>;

export function withStorageSync<
  State extends object,
  Input extends SignalStoreFeatureResult
>(
  configOrKey: SyncConfig<Input['state']> | string,
  StorageServiceClass: StorageServiceFactory = withLocalStorage()
): SignalStoreFeature<
  Input,
  WithStorageSyncFeatureResult | WithIndexeddbStorageSyncFeatureResult
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
          Promise.resolve(store.readFromStorage()).then(() => {
            runInInjectionContext(envInjector, () => {
              effect(() => {
                store.writeToStorage();
              });
            });
          });
        }
      },
    })
  );
}
