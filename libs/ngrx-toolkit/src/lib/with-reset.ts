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
  /**
   * @deprecated Use {@link reset} instead.
   */
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
          patchState(
            store,
            reset(() => store._resetState.value),
          );
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

/**
 * Creates a default value for a given type
 */
function getDefaultValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return [];
  }

  if (typeof value === 'object' && value.constructor === Object) {
    return {};
  }

  if (typeof value === 'string') {
    return '';
  }

  if (typeof value === 'number') {
    return 0;
  }

  if (typeof value === 'boolean') {
    return false;
  }

  if (value instanceof Date) {
    return new Date();
  }

  // For other types (functions, classes, etc.), return undefined
  return undefined;
}

/**
 * Creates a generic reset state by resetting each property to its default value
 */
function resetState<TState extends object>(state: TState): TState {
  const resetState = {} as TState;

  for (const key in state) {
    resetState[key] = getDefaultValue(state[key]) as TState[Extract<
      keyof TState,
      string
    >];
  }

  return resetState;
}

export function reset<TState extends object, K extends keyof TState>(
  pick?: (initial: TState) => Pick<TState, K>,
): (state: TState) => TState {
  return (state: TState) => {
    return pick ? { ...state, ...pick(state) } : resetState(state);
  };
}
