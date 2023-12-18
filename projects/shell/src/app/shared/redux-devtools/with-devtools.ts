import { SignalStoreFeature, patchState as originalPatchState } from '@ngrx/signals';
import { SignalStoreFeatureResult } from '@ngrx/signals/src/signal-store-models';
import { addStoreToReduxDevtools } from './devtools-connect';
import { addActionName } from './devtools-core';
import { EmptyFeatureResult, PatchFn } from './model';


/**
 * Devtools Public API: Custom Feature, Patch State
 * @param name store's name as it should appear in the DevTools
 */
export function withDevtools<Input extends SignalStoreFeatureResult>(
  name: string
): SignalStoreFeature<Input, EmptyFeatureResult> {
  return (store) => {
    addStoreToReduxDevtools(store, name);

    return store;
  };
}

export const patchState: PatchFn = (state, action, ...rest) => {
  addActionName(action);
  return originalPatchState(state, ...rest);
};
