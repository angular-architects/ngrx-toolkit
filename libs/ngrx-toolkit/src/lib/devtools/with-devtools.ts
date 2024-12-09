import { signalStoreFeature, withHooks, withMethods } from '@ngrx/signals';
import { inject } from '@angular/core';
import { DevtoolsSyncer } from './internal/devtools-syncer.service';
import { getStoreSignal } from '../shared/get-store-signal';

export type Action = { type: string };

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__:
      | {
          connect: (options: { name: string }) => {
            send: (action: Action, state: Record<string, unknown>) => void;
          };
        }
      | undefined;
  }
}

export type DevtoolsOptions = {
  indexNames: boolean;
};

export const existingNames = new Map<string, unknown>();

/**
 * Adds this store as a feature state to the Redux DevTools.
 *
 * By default, the action name is 'Store Update'. You can
 * change that via the `patch` method, which has as second
 * parameter the action name.
 *
 * It adds the method `renameDevtoolsName` which allows
 * you to rename the features store after instantiation.
 *
 * This method has to be executed before the first
 * synchronization. In most cases. that's in the constructor.
 *
 * @param name name of the store as it should appear in the DevTools
 * @param options options for the DevTools
 */
export function withDevtools(
  name: string,
  options: Partial<DevtoolsOptions> = {}
) {
  if (existingNames.has(name)) {
    throw new Error(
      `A store with name ${name} has already been registered for the Devtools`
    );
  }
  existingNames.set(name, true);
  const finalOptions: DevtoolsOptions = { ...{ indexNames: true }, ...options };
  return signalStoreFeature(
    withMethods((store) => {
      const syncer = inject(DevtoolsSyncer);
      syncer.addStore(name, getStoreSignal(store), finalOptions);

      return {
        renameDevtoolsName(newName: string): void {
          syncer.renameStore(name, newName);
        },
      };
    }),
    withHooks(() => {
      const syncer = inject(DevtoolsSyncer);
      return { onDestroy: () => syncer.removeStore(name) };
    })
  );
}
