import {
  EmptyFeatureResult,
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  withHooks,
  withState,
  watchState,
} from '@ngrx/signals';
import { deepFreeze } from './deep-freeze';
import { isDevMode } from './is-dev-mode';

/**
 * The implementation of this feature is a little bit tricky.
 *
 * `signalStore` does a shallow clone in the initial phase, in order to
 * merge all different states together.
 *
 * Shallow cloning also happens in `patchState`.
 *
 * With shallow cloning, the root state object is replaced, which means,
 * the freezing only stays for its nested properties but not for
 * the primitive and immediate properties.
 *
 * For example:
 *
 * ```ts
 * const state = {
 *   id: 1,
 *   address: {
 *     street: 'Main St',
 *     city: 'Springfield',
 *   }
 * }
 * ```
 *
 * Running `Object.freeze` on `state` will freeze the `address` object, and
 * the `id`. But since `state` is shallow cloned, the "frozing" state of the
 * `id` is lost. `address`, being an object, is still frozen.
 *
 * To overcome that, we run `watchState` and run `deepFreeze`
 * on every change.
 */

/**
 * Prevents mutation of the state.
 *
 * This is done by deeply applying `Object.freeze`. Any mutable change within
 * or outside the `SignalStore` will throw an error.
 *
 * @param state the state object
 * @param options enable protection in production (default: false)
 */
export function withImmutableState<State extends object>(
  state: State,
  options?: { enableInProduction?: boolean }
): SignalStoreFeature<
  SignalStoreFeatureResult,
  EmptyFeatureResult & { state: State }
>;
/**
 * Prevents mutation of the state.
 *
 * This is done by deeply applying `Object.freeze`. Any mutable change within
 * or outside the `SignalStore` will throw an error.
 *
 * @param stateFactory a function returning the state object
 * @param options enable protection in production (default: false)
 */
export function withImmutableState<State extends object>(
  stateFactory: () => State,
  options?: { enableInProduction?: boolean }
): SignalStoreFeature<
  SignalStoreFeatureResult,
  EmptyFeatureResult & { state: State }
>;
export function withImmutableState<State extends object>(
  stateOrFactory: State | (() => State),
  options?: { enableInProduction?: boolean }
): SignalStoreFeature<
  SignalStoreFeatureResult,
  EmptyFeatureResult & { state: State }
> {
  const immutableState =
    typeof stateOrFactory === 'function' ? stateOrFactory() : stateOrFactory;
  const stateKeys = Reflect.ownKeys(immutableState);

  const applyFreezing = isDevMode() || options?.enableInProduction === true;
  return signalStoreFeature(
    withState(immutableState),
    withHooks((store) => ({
      onInit() {
        if (!applyFreezing) {
          return;
        }
        /**
         * `immutableState` will be initially frozen. That is because
         * of potential mutations outside the SignalStore
         *
         * ```ts
         * const initialState = {id: 1};
         * signalStore(withImmutableState(initialState));
         *
         * initialState.id = 2; // must throw immutability
         * ```
         */

        Object.freeze(immutableState);
        watchState(store, (state) => {
          deepFreeze(state, stateKeys);
        });
      },
    }))
  );
}
