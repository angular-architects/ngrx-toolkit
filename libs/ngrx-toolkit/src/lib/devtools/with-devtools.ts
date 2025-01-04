import { signalStoreFeature, withHooks, withMethods } from '@ngrx/signals';
import { inject } from '@angular/core';
import { DevtoolsSyncer } from './internal/devtools-syncer.service';
import { DevtoolsFeature } from './devtools-feature';

export type Action = { type: string };
export type Connection = {
  send: (action: Action, state: Record<string, unknown>) => void;
};
export type ReduxDevtoolsExtension = {
  connect: (options: { name: string }) => Connection;
};

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: ReduxDevtoolsExtension | undefined;
  }
}

export type DevtoolsOptions = {
  indexNames: boolean;
};

export const existingNames = new Map<string, unknown>();

export const renameDevtoolsMethodName = '___renameDevtoolsName';
export const uniqueDevtoolsId = '___uniqueDevtoolsId';

/**
 * Adds this store as a feature state to the Redux DevTools.
 *
 * By default, the action name is 'Store Update'. You can
 * change that via the {@link updateState} method, which has as second
 * parameter the action name.
 *
 * The standalone function {@link renameDevtoolsName} can rename
 * the store name.
 *
 * @param name name of the store as it should appear in the DevTools
 * @param features features to extend or modify the behavior of the Devtools
 */
export function withDevtools(name: string, ...features: DevtoolsFeature[]) {
  if (existingNames.has(name)) {
    throw new Error(
      `The store "${name}" has already been registered in the DevTools. Duplicate registration is not allowed.`
    );
  }
  existingNames.set(name, true);
  const finalOptions = {
    indexNames: !features.some((f) => f.indexNames === false),
  };

  return signalStoreFeature(
    withMethods((store) => {
      const syncer = inject(DevtoolsSyncer);
      const id = syncer.addStore(name, store, finalOptions);

      // TODO: use withProps and symbols
      return {
        [renameDevtoolsMethodName]: (newName: string) => {
          syncer.renameStore(name, newName);
        },
        [uniqueDevtoolsId]: () => id,
      } as Record<string, (newName?: unknown) => unknown>;
    }),
    withHooks((store) => {
      const syncer = inject(DevtoolsSyncer);
      const id = Number(store[uniqueDevtoolsId]());
      return { onDestroy: () => syncer.removeStore(id) };
    })
  );
}
