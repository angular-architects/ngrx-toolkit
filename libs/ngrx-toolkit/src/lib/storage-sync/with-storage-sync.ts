import { isPlatformServer } from '@angular/common';
import { computed, inject, PLATFORM_ID, signal } from '@angular/core';
import {
  EmptyFeatureResult,
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  watchState,
  withComputed,
  withHooks,
  withMethods,
  withProps,
} from '@ngrx/signals';
import {
  AsyncFeatureResult,
  AsyncMethods,
  AsyncStorageStrategy,
  SyncFeatureResult,
  SyncMethods,
  SyncStorageStrategy,
} from './internal/models';
import { withLocalStorage } from './features/with-local-storage';

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
  select?: (state: State) => unknown;
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
  stringify?: (state: unknown) => string;
};

/**
 * Enables store synchronization with storage.
 *
 * Only works on browser platform.
 */

// only key
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string
): SignalStoreFeature<Input, SyncFeatureResult>;

// key + indexeddb
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string,
  storageStrategy: AsyncStorageStrategy<Input['state']>
): SignalStoreFeature<Input, AsyncFeatureResult>;

// key + localStorage(or sessionStorage)
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  key: string,
  storageStrategy: SyncStorageStrategy<Input['state']>
): SignalStoreFeature<Input, SyncFeatureResult>;

// config + localStorage
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>
): SignalStoreFeature<Input, SyncFeatureResult>;

// config + indexeddb
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>,
  storageStrategy: AsyncStorageStrategy<Input['state']>
): SignalStoreFeature<Input, AsyncFeatureResult>;

// config + localStorage(or sessionStorage)
export function withStorageSync<Input extends SignalStoreFeatureResult>(
  config: SyncConfig<Input['state']>,
  storageStrategy: SyncStorageStrategy<Input['state']>
): SignalStoreFeature<Input, SyncFeatureResult>;

export function withStorageSync<Input extends SignalStoreFeatureResult>(
  configOrKey: SyncConfig<Input['state']> | string,
  storageStrategy?:
    | AsyncStorageStrategy<Input['state']>
    | SyncStorageStrategy<Input['state']>
): SignalStoreFeature<
  Input,
  EmptyFeatureResult & { methods: AsyncMethods | SyncMethods }
> {
  const config: Required<SyncConfig<Input['state']>> = {
    autoSync: true,
    select: (state: Input['state']) => state,
    parse: JSON.parse,
    stringify: JSON.stringify,
    ...(typeof configOrKey === 'string' ? { key: configOrKey } : configOrKey),
  };

  const factory = storageStrategy ?? withLocalStorage();

  return signalStoreFeature(
    withProps(() => ({
      // it is necessary to have a signal here, so that its changes are
      // not tracked by the autoSync mechanism and trigger an infinite loop.
      _syncStatus: signal<'idle' | 'syncing' | 'synced'>('idle'),
    })),
    withComputed(({ _syncStatus }) => ({
      isSynced: computed(() => _syncStatus() === 'synced'),
    })),
    withMethods((store, platformId = inject(PLATFORM_ID)) => {
      const setSyncStatus = (status: 'idle' | 'syncing' | 'synced') =>
        store._syncStatus.set(status);

      return factory(
        config,
        store,
        isPlatformServer(platformId),
        setSyncStatus
      );
    }),
    withHooks({
      onInit(store, platformId = inject(PLATFORM_ID)) {
        if (isPlatformServer(platformId)) {
          return;
        }

        if (config.autoSync) {
          const initAutoSync = () =>
            watchState(store, () => store.writeToStorage());
          const possiblePromise =
            store.readFromStorage() as void | Promise<void>;
          if (possiblePromise) {
            possiblePromise.then(initAutoSync);
          } else {
            initAutoSync();
          }
        }
      },
    })
  );
}
