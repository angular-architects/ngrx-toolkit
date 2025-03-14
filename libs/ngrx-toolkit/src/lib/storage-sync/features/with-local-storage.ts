import { inject, Type } from '@angular/core';
import { getState, patchState, WritableStateSource } from '@ngrx/signals';
import { SyncStorageStrategy } from '../internal/models';
import { SessionStorageService } from '../internal/session-storage.service';
import { LocalStorageService } from '../internal/local-storage.service';
import { SyncConfig } from '../with-storage-sync';

export function withLocalStorage<
  State extends object
>(): SyncStorageStrategy<State> {
  return createSyncMethods<State>(LocalStorageService);
}

export function withSessionStorage<State extends object>() {
  return createSyncMethods<State>(SessionStorageService);
}

function createSyncMethods<State extends object>(
  Storage: Type<LocalStorageService | SessionStorageService>
): SyncStorageStrategy<State> {
  function factory(
    { key, parse, select, stringify }: Required<SyncConfig<State>>,
    store: WritableStateSource<State>,
    useStubs: boolean
  ) {
    if (useStubs) {
      return {
        clearStorage: () => undefined,
        readFromStorage: () => undefined,
        writeToStorage: () => undefined,
      };
    }

    const storage = inject(Storage);

    return {
      clearStorage(): void {
        storage.clear(key);
      },

      readFromStorage(): void {
        const stateString = storage.getItem(key);

        if (stateString) {
          patchState(store, parse(stateString));
        }
      },

      writeToStorage() {
        const slicedState = select(getState(store));
        storage.setItem(key, stringify(slicedState));
      },
    };
  }
  factory.type = 'sync' as const;

  return factory;
}
