import { IndexedDBService } from '../internal/indexeddb.service';
import { inject } from '@angular/core';
import { getState, patchState, WritableStateSource } from '@ngrx/signals';
import { AsyncStorageStrategy, SetSyncStatus } from '../internal/models';
import { SyncConfig } from '../with-storage-sync';

export function withIndexeddb<
  State extends object
>(): AsyncStorageStrategy<State> {
  function factory(
    { key, parse, select, stringify }: Required<SyncConfig<State>>,
    store: WritableStateSource<State>,
    useStubs: boolean,
    setSyncStatus: SetSyncStatus
  ) {
    if (useStubs) {
      return {
        clearStorage: () => Promise.resolve(),
        readFromStorage: () => Promise.resolve(),
        writeToStorage: () => Promise.resolve(),
      };
    }

    const indexeddbService = inject(IndexedDBService);

    return {
      /**
       * Removes the item stored in storage.
       */
      async clearStorage(): Promise<void> {
        setSyncStatus('syncing');
        patchState(store, {});
        await indexeddbService.clear(key);
        setSyncStatus('synced');
      },
      /**
       * Reads item from storage and patches the state.
       */
      async readFromStorage(): Promise<void> {
        setSyncStatus('syncing');
        const stateString = await indexeddbService.getItem(key);

        if (stateString) {
          patchState(store, parse(stateString));
        }
        setSyncStatus('synced');
      },
      /**
       * Writes selected portion to storage.
       */
      async writeToStorage(): Promise<void> {
        setSyncStatus('syncing');
        const slicedState = select(getState(store));
        await indexeddbService.setItem(key, stringify(slicedState));
        setSyncStatus('synced');
      },
    };
  }
  factory.type = 'async' as const;

  return factory;
}
