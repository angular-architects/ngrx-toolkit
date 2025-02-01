import {
  EmptyFeatureResult,
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  withState,
} from '@ngrx/signals';
import { deepFreeze } from './deep-freeze';
import { isDevMode } from './is-dev-mode';

/**
 * Adds a state which is protected from being modified.
 *
 * This is done by deeply applying `Object.freeze`. Any mutable change within
 * or outside the `SignalStore` will throw an error.
 *
 * In order to keep the state protected, you need to run `updateState`.
 * In contrast to `patchState`, `updateState` will check if the original state
 * is frozen and would re-apply it again.
 *
 * @param state the state object
 * @param options disable protection in production (default: true)
 */
export function withImmutableState<State extends object>(
  state: State,
  options?: { disableProtectionInProd?: boolean }
): SignalStoreFeature<
  SignalStoreFeatureResult,
  EmptyFeatureResult & { state: State }
>;
/**
 * Adds a state which is protected from being modified.
 *
 * This is done by deeply applying `Object.freeze`. Any mutable change within
 * or outside the `SignalStore` will throw an error.
 *
 * In order to keep the state protected, you need to run `updateState`.
 * In contrast to `patchState`, `updateState` will check if the original state
 * is frozen and would re-apply it again.
 *
 * @param stateFactory a function returning the state object
 * @param options disable protection in production (default: true)
 */
export function withImmutableState<State extends object>(
  stateFactory: () => State,
  options?: { disableProtectionInProd?: boolean }
): SignalStoreFeature<
  SignalStoreFeatureResult,
  EmptyFeatureResult & { state: State }
>;
export function withImmutableState<State extends object>(
  stateOrFactory: State | (() => State),
  options?: { disableProtectionInProd?: boolean }
): SignalStoreFeature<
  SignalStoreFeatureResult,
  EmptyFeatureResult & { state: State }
> {
  return signalStoreFeature(
    withState(() => {
      const disableProtectionInProd = options?.disableProtectionInProd ?? true;
      const state =
        typeof stateOrFactory === 'function'
          ? stateOrFactory()
          : stateOrFactory;
      if (isDevMode() || !disableProtectionInProd) {
        deepFreeze(state as Record<string | symbol, unknown>);
      }

      return state;
    })
  );
}
