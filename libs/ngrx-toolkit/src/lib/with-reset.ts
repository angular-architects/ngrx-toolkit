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
  resetSlice(slice: string | string[]): void;
};

/**
 * Adds a `resetState` method to the store, which resets the state
 * to the initial state.
 *
 * If you want to set a custom initial state, you can use {@link setResetState}.
 */
export function withReset() {
  return signalStoreFeature(
    withProps(() => ({ _resetState: { value: {} as Record<string, any> } })),
    withMethods((store): PublicMethods => {
      // workaround to TS excessive property check
      const methods = {
        resetState() {
          patchState(store, store._resetState.value);
        },
        resetSlice(slice: string | string[]) {
          patchState(store, (state) => ({
            ...state,
            ...(typeof slice === 'string'
              ? { [slice]: store._resetState.value[slice] }
              : slice.reduce((acc, key) => {
                  acc[key] = store._resetState.value[key];
                  return acc;
                }, {} as Record<string, any>)),
          }));
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
    }))
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
  state: State
): void {
  if (!('__setResetState__' in store)) {
    throw new Error(
      'Cannot set reset state, since store is not configured with withReset()'
    );
  }
  (store.__setResetState__ as (state: State) => void)(state);
}
