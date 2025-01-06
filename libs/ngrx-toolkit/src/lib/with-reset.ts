import {
  getState,
  patchState,
  signalStoreFeature,
  withHooks,
  withMethods,
  withProps,
} from '@ngrx/signals';

export function withReset() {
  return signalStoreFeature(
    withProps(() => ({ _resetState: { value: {} } })),
    withMethods((store) => ({
      resetState() {
        patchState(store, store._resetState.value);
      },
    })),
    withHooks((store) => ({
      onInit() {
        store._resetState.value = getState(store);
      },
    }))
  );
}
