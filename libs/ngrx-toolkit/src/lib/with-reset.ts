import {
  getState,
  patchState,
  signalStoreFeature,
  StateSource,
  withHooks,
  withMethods,
  withProps,
} from '@ngrx/signals';

export type PublicMethods = {
  resetState(): void;
};

/**
 * Adds a `resetState` method to the store, which resets the state
 * to the initial state.
 *
 * If you want to set a custom initial state, you can use {@link setResetState}.
 */
export function withReset() {
  return signalStoreFeature(
    withProps(() => ({ _resetState: { value: {} } })),
    withMethods((store): PublicMethods => {
      // workaround to TS excessive property check
      const methods = {
        resetState() {
          patchState(store, store._resetState.value);
        },
        __setResetState__(state: object) {
          store._resetState.value = state;
        },
      };

      return methods;
    }),
    withHooks((store) => ({
      onInit() {
        store._resetState.value = getState(store);
      },
    })),
  );
}

/**
 * Sets the reset state of the store to the given state.
 *
 * Throws an error if the store is not configured with {@link withReset}.
 * @param store the instance of a SignalStore
 * @param state the state to set as the reset state
 */
export function setResetState<State extends object>(
  store: StateSource<State>,
  state: State,
): void {
  if (!('__setResetState__' in store)) {
    throw new Error(
      'Cannot set reset state, since store is not configured with withReset()',
    );
  }
  (store.__setResetState__ as (state: State) => void)(state);
}
