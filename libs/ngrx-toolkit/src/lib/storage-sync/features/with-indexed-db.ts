import { inject } from '@angular/core';
import { getState, patchState } from '@ngrx/signals';
import { IndexedDBService } from '../internal/indexeddb.service';
import {
  AsyncMethods,
  AsyncStorageStrategy,
  AsyncStoreForFactory,
  SYNC_STATUS,
} from '../internal/models';
import { SyncConfig } from '../with-storage-sync';

export function withIndexedDB<
  State extends object,
>(): AsyncStorageStrategy<State> {
  function factory(
    { key, parse, select, stringify }: Required<SyncConfig<State>>,
    store: AsyncStoreForFactory<State>,
    useStubs: boolean,
  ): AsyncMethods {
    if (useStubs) {
      return {
        clearStorage: () => Promise.resolve(),
        readFromStorage: () => Promise.resolve(),
        writeToStorage: () => Promise.resolve(),
      };
    }

    const indexeddbService = inject(IndexedDBService);

    function warnOnSyncing(mode: 'read' | 'write'): void {
      if (store[SYNC_STATUS]() === 'syncing') {
        const prettyMode = mode === 'read' ? 'Reading' : 'Writing';
        console.warn(
          `${prettyMode} to Store (${key}) happened during an ongoing synchronization process.`,
          'Please ensure that the store is not in syncing state via `store.whenSynced()`.',
          'Alternatively, you can disable the autoSync by passing `autoSync: false` in the config.',
        );
      }
    }

    return {
      /**
       * Removes the item stored in storage.
       */
      async clearStorage(): Promise<void> {
        warnOnSyncing('write');
        store[SYNC_STATUS].set('syncing');
        patchState(store, {});
        await indexeddbService.clear(key);
        store[SYNC_STATUS].set('synced');
      },

      /**
       * Reads item from storage and patches the state.
       */
      async readFromStorage(): Promise<void> {
        warnOnSyncing('read');
        store[SYNC_STATUS].set('syncing');
        const stateString = await indexeddbService.getItem(key);
        if (stateString) {
          patchState(store, parse(stateString));
        }
        store[SYNC_STATUS].set('synced');
      },

      /**
       * Writes selected portion to storage.
       */
      async writeToStorage(): Promise<void> {
        warnOnSyncing('write');
        store[SYNC_STATUS].set('syncing');
        const slicedState = select(getState(store)) as State;
        await indexeddbService.setItem(key, stringify(slicedState));
        store[SYNC_STATUS].set('synced');
      },
    };
  }
  factory.type = 'async' as const;

  return factory;
}
