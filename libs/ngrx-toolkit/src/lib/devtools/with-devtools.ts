import { inject } from '@angular/core';
import {
  EmptyFeatureResult,
  SignalStoreFeature,
  signalStoreFeature,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tap } from 'rxjs';
import { currentActionNames } from './internal/current-action-names';
import { DefaultTracker } from './internal/default-tracker';
import {
  DevtoolsFeature,
  DevtoolsInnerOptions,
} from './internal/devtools-feature';
import { DevtoolsSyncer } from './internal/devtools-syncer.service';
import { ReduxDevtoolsExtension } from './internal/models';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: ReduxDevtoolsExtension | undefined;
  }
}

export const renameDevtoolsMethodName = '___renameDevtoolsName';
export const uniqueDevtoolsId = '___uniqueDevtoolsId';
export const devtoolsEventsTracker = '___devtoolsEventsTracker';

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
  return signalStoreFeature(
    withMethods(() => {
      const syncer = inject(DevtoolsSyncer);

      const id = syncer.getNextId();

      // TODO: use withProps and symbols
      return {
        [renameDevtoolsMethodName]: (newName: string) => {
          syncer.renameStore(name, newName);
        },
        [uniqueDevtoolsId]: () => id,
        [devtoolsEventsTracker]: rxMethod<{ type: string }>((c$) =>
          c$.pipe(
            tap((ev) => {
              if (ev && typeof ev.type === 'string' && ev.type.length > 0) {
                currentActionNames.add(ev.type);
              }
            }),
          ),
        ),
      } as Record<string, (newName?: unknown) => unknown>;
    }),
    withHooks((store) => {
      const syncer = inject(DevtoolsSyncer);
      const id = String(store[uniqueDevtoolsId]());
      return {
        onInit() {
          const id = String(store[uniqueDevtoolsId]());
          const finalOptions: DevtoolsInnerOptions = {
            indexNames: !features.some((f) => f.indexNames === false),
            map: features.find((f) => f.map)?.map ?? ((state) => state),
            tracker: inject(
              features.find((f) => f.tracker)?.tracker || DefaultTracker,
            ),
            eventsTracking: features.some((f) => f.eventsTracking === true),
          };

          syncer.addStore(id, name, store, finalOptions);

          for (const feature of features) {
            if (typeof feature.onInit === 'function') {
              feature.onInit({
                id,
                name,
                trackEvents: (source$) => store[devtoolsEventsTracker](source$),
              });
            }
          }
        },
        onDestroy() {
          syncer.removeStore(id);
        },
      };
    }),
  ) as SignalStoreFeature<EmptyFeatureResult, EmptyFeatureResult>;
}
