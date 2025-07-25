import { isPlatformServer } from '@angular/common';
import { computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import {
  EmptyFeatureResult,
  getState,
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  watchState,
  withHooks,
  withMethods,
  withProps,
} from '@ngrx/signals';
import { withLocalStorage } from './features/with-local-storage';
import {
  AsyncFeatureResult,
  AsyncStorageStrategy,
  SYNC_STATUS,
  SyncFeatureResult,
  SyncStorageStrategy,
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
  EmptyFeatureResult & (SyncFeatureResult | AsyncFeatureResult)
> {
  const config: Required<SyncConfig<Input['state']>> = {
    autoSync: true,
    select: (state: Input['state']) => state,
    parse: JSON.parse,
    stringify: JSON.stringify,
    ...(typeof configOrKey === 'string' ? { key: configOrKey } : configOrKey),
  };

  const factory = storageStrategy ?? withLocalStorage();

  if (factory.type === 'sync') {
    return createSyncStorageSync(factory, config);
  } else {
    return createAsyncStorageSync(factory, config);
  }
}

function createSyncStorageSync<Input extends SignalStoreFeatureResult>(
  factory: SyncStorageStrategy<Input['state']>,
  config: Required<SyncConfig<Input['state']>>
) {
  return signalStoreFeature(
    withMethods((store, platformId = inject(PLATFORM_ID)) => {
      return factory(config, store, isPlatformServer(platformId));
    }),
    withHooks({
      onInit(store, platformId = inject(PLATFORM_ID)) {
        if (isPlatformServer(platformId)) {
          return;
        }

        if (config.autoSync) {
          store.readFromStorage();
          watchState(store, () => store.writeToStorage());
        }
      },
    })
  ) satisfies SignalStoreFeature<EmptyFeatureResult, SyncFeatureResult>;
}

function createAsyncStorageSync<Input extends SignalStoreFeatureResult>(
  factory: AsyncStorageStrategy<Input['state']>,
  config: Required<SyncConfig<Input['state']>>
) {
  return signalStoreFeature(
    withProps(() => {
      const props = {
        /*
        // we need to have that as property (and not state)
        // Otherwise the state watcher fires when updating the sync status
        */
        [SYNC_STATUS]: signal<'idle' | 'syncing' | 'synced'>('idle'),
      };

      const resolves = [] as (() => void)[];

      effect(() => {
        const syncStatus = props[SYNC_STATUS]();
        if (syncStatus === 'synced') {
          resolves.forEach((resolve) => resolve());
          resolves.splice(0, resolves.length);
        }
      });

      return {
        ...props,
        isSynced: computed(() => props[SYNC_STATUS]() === 'synced'),
        whenSynced: () =>
          new Promise<void>((resolve) => {
            if (props[SYNC_STATUS]() === 'synced') {
              resolve();
            } else {
              resolves.push(resolve);
            }
          }),
      };
    }),
    withMethods((store, platformId = inject(PLATFORM_ID)) => {
      return factory(config, store, isPlatformServer(platformId));
    }),
    withHooks({
      async onInit(store, platformId = inject(PLATFORM_ID)) {
        if (isPlatformServer(platformId)) {
          return;
        }

        const initialState = getState(store);
        console.log('Initial state:', initialState);
        if (config.autoSync) {
          let startWatching = false;
          watchState(store, () => {
            if (!startWatching) {
              if (getState(store) === initialState) {
                return;
              }

              console.log(
                'Received state change, starting to watch state changes..., %o',
                getState(store)
              );
              console.warn(
                `Writing to Store (${config.key}) happened before the state was initially read from storage.`,
                'Please ensure that the store is not in syncing state via `store.whenSynced()` before writing to the state.',
                'Alternatively, you can disable autoSync by passing `autoSync: false` in the config.'
              );
              return;
            }
            return store.writeToStorage();
          });

          await store.readFromStorage();
          startWatching = true;
        }
      },
    })
  ) satisfies SignalStoreFeature<EmptyFeatureResult, AsyncFeatureResult>;
}
