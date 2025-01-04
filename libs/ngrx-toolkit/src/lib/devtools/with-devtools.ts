import {
  SignalStoreFeature,
  signalStoreFeature,
  SignalStoreFeatureResult,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { DevtoolsSyncer } from './internal/devtools-syncer.service';

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
  /**
   * If multiple instances of the same SignalStore class
   * exist, their devtool names are indexed.
   *
   * If this feature is disabled, this feature throws
   * a runtime error.
   *
   * By default, the value is `true`.
   *
   * For example:
   * <pre>
   * const Store = signalStore(
   *   withDevtools('flights', { indexNames: true })
   * )
   *
   * const store1 = new Store(); // will show up as 'flights'
   * const store2 = new Store(); // will show up as 'flights-1'
   * </pre>
   *
   * With value set to `false`:
   * <pre>
   * const Store = signalStore(
   *   withDevtools('flights', { indexNames: false })
   * )
   *
   * const store1 = new Store(); // will show up as 'flights'
   * const store2 = new Store(); //💥 throws an error
   * </pre>
   *
   */
  indexNames: boolean;
};

export const existingNames = new Map<string, unknown>();

export const renameDevtoolsMethodName = '___renameDevtoolsName';
export const uniqueDevtoolsId = '___uniqueDevtoolsId';

/**
 * Adds this store as a feature state to the Redux DevTools.
 *
 * By default, the action name is 'Store Update'. You can
 * change that via the `patch` method, which has as second
 * parameter the action name.
 *
 * The standalone function {@link renameDevtoolsName} can rename
 * the store name.
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
      `The store "${name}" has already been registered in the DevTools. Duplicate registration is not allowed.`
    );
  }
  existingNames.set(name, true);
  const finalOptions: DevtoolsOptions = { ...{ indexNames: true }, ...options };
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
