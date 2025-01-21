import {
  EmptyFeatureResult,
  patchState,
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  withMethods,
} from '@ngrx/signals';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export type SyncDriver<State> = {
  /**
   * read from Storage(localStorage, sessionStorage, indexedDB)
   */
  read(): State | undefined | Promise<State | undefined>;

  /**
   * write to Storage(localStorage, sessionStorage, indexedDB)
   */
  write(): void | Promise<void>;

  /**
   * clear Storage(localStorage, sessionStorage, indexedDB)
   */
  clear(): void | Promise<void>;
};

export type CreateSyncOptions<State> = {
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
};

const createStorageSyncFeatureStub: Pick<
  SignalStoreFeatureResult,
  'methods'
>['methods'] = {
  read: () => void true,
  write: () => void true,
  clear: () => void true,
};

export function createStorageSyncFeature<
  State extends object,
  Input extends SignalStoreFeatureResult
>(
  driverFactory: () => SyncDriver<State>,
  options: CreateSyncOptions<State>
): SignalStoreFeature<Input, EmptyFeatureResult> {
  const { autoSync = true, select = (state: State) => state } = options;

  return signalStoreFeature(
    withMethods((store, platformId = inject(PLATFORM_ID)) => {
      if (isPlatformServer(platformId)) {
        return createStorageSyncFeatureStub;
      }

      const driver = driverFactory();

      return {
        read: async () => {
          const value = await driver.read();

          if (value) {
            patchState(store, select(value));
          }
          // todo value typed check
        },

        write: async () => {
          // todo
        },

        clear: async () => {
          // todo
        },
      };
    })
  );
}
