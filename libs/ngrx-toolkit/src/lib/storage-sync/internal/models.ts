import { Signal, WritableSignal } from '@angular/core';
import { EmptyFeatureResult, WritableStateSource } from '@ngrx/signals';
import { SyncConfig } from '../with-storage-sync';

export type SyncMethods = {
  clearStorage(): void;
  readFromStorage(): void;
  writeToStorage(): void;
};

export type SyncFeatureResult = EmptyFeatureResult & {
  methods: SyncMethods;
};

export type SyncStoreForFactory<State extends object> =
  WritableStateSource<State>;

export type SyncStorageStrategy<State extends object> = ((
  config: Required<SyncConfig<State>>,
  store: SyncStoreForFactory<State>,
  useStubs: boolean,
) => SyncMethods) & { type: 'sync' };

export type AsyncMethods = {
  clearStorage(): Promise<void>;
  readFromStorage(): Promise<void>;
  writeToStorage(): Promise<void>;
};

/**
 * AsyncFeatureResult is used as the public interface that users interact with
 * when calling `withIndexedDB`. It intentionally omits the internal SYNC_STATUS
 * property to avoid TypeScript error TS4058 (return type of public method
 * includes private type).
 *
 * For internal implementation, we use AsyncStoreForFactory which includes
 * the SYNC_STATUS property needed for state management.
 */
export const SYNC_STATUS = Symbol('SYNC_STATUS');
export type SyncStatus = 'idle' | 'syncing' | 'synced';

// Keeping it internal avoids TS4058 error
export type InternalAsyncProps = AsyncFeatureResult['props'] & {
  [SYNC_STATUS]: WritableSignal<SyncStatus>;
};

export type AsyncFeatureResult = EmptyFeatureResult & {
  methods: AsyncMethods;
  props: {
    isSynced: Signal<boolean>;
    whenSynced: () => Promise<void>;
  };
};

export type AsyncStoreForFactory<State extends object> =
  WritableStateSource<State> & InternalAsyncProps;

export type AsyncStorageStrategy<State extends object> = ((
  config: Required<SyncConfig<State>>,
  store: AsyncStoreForFactory<State>,
  useStubs: boolean,
) => AsyncMethods) & { type: 'async' };
