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
  useStubs: boolean
) => SyncMethods) & { type: 'sync' };

export type AsyncMethods = {
  clearStorage(): Promise<void>;
  readFromStorage(): Promise<void>;
  writeToStorage(): Promise<void>;
};

export const SYNC_STATUS = Symbol('SYNC_STATUS');
export type SyncStatus = 'idle' | 'syncing' | 'synced';

export type AsyncFeatureResult = EmptyFeatureResult & {
  methods: AsyncMethods;
  props: {
    isSynced: Signal<boolean>;
    whenSynced: () => Promise<void>;
    [SYNC_STATUS]: WritableSignal<SyncStatus>;
  };
};

export type AsyncStoreForFactory<State extends object> =
  WritableStateSource<State> & AsyncFeatureResult['props'];

export type AsyncStorageStrategy<State extends object> = ((
  config: Required<SyncConfig<State>>,
  store: AsyncStoreForFactory<State>,
  useStubs: boolean
) => AsyncMethods) & { type: 'async' };
