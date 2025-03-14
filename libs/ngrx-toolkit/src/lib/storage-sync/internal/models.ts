import { EmptyFeatureResult, WritableStateSource } from '@ngrx/signals';
import { SyncConfig } from '../with-storage-sync';
import { Signal } from '@angular/core';

export type SyncMethods = {
  clearStorage(): void;
  readFromStorage(): void;
  writeToStorage(): void;
};

export type SyncFeatureResult = EmptyFeatureResult & {
  methods: SyncMethods;
};

export type SyncStorageStrategy<State extends object> = ((
  config: Required<SyncConfig<State>>,
  store: WritableStateSource<State>,
  useStubs: boolean
) => SyncMethods) & { type: 'sync' };

export type AsyncMethods = {
  clearStorage(): Promise<void>;
  readFromStorage(): Promise<void>;
  writeToStorage(): Promise<void>;
};

export type AsyncFeatureResult = EmptyFeatureResult & {
  methods: AsyncMethods;
  props: { isSynced: Signal<boolean>; whenSynced: () => Promise<void> };
};

export type AsyncStorageStrategy<State extends object> = ((
  config: Required<SyncConfig<State>>,
  store: WritableStateSource<State>,
  useStubs: boolean,
  setSyncStatus: SetSyncStatus
) => AsyncMethods) & { type: 'async' };

export type SetSyncStatus = (status: 'idle' | 'syncing' | 'synced') => void;
