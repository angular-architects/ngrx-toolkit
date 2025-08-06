import {
  EmptyFeatureResult,
  getState,
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  watchState,
  withHooks,
  withState,
} from '@ngrx/signals';
import { deepFreeze } from './deep-freeze';
import { isDevMode } from './is-dev-mode';

/**
 * Starting from v20, the root properties of the state object
 * are all of type `WritableSignal`.
 *
 * That means, we cannot freeze root properties, which are of a
 * primitive data type.
 *
 * This is a breaking change to v19, where the state was on Signal
 * in total. We had the possibility to freeze that Signal's
 * object and could therefore provide immutability also for
 * root properties of primitive data types.
 *
 * For example:
 *
 * ```ts
 * const state = {
 *   id: 1, // was frozen in v19, but not in >= v20
 *   address: {
 *     street: 'Main St',
 *     city: 'Springfield',
 *   }
 * }
 * ```
 */

/**
 * Prevents mutation of the state.
 *
 * This is done by applying `Object.freeze` to each root
 * property of the state. Any mutable change within
 * or outside the `SignalStore` will throw an error.
 *
 * Root properties of the state having a primitive data type
 * are not supported.
 *
 *  * For example:
 *
 * ```ts
 * const state = {
 *   // ⛔️ are not frozen -> mutable changes possible
 *   id: 1,
 *
 *   // ✅ are frozen -> mutable changes throw
 *   address: {
 *     street: 'Main St',
 *     city: 'Springfield',
 *   }
 * }
 * ```
 *
 * @param state the state object
 * @param options enable protection in production (default: false)
 */
export function withImmutableState<State extends object>(
  state: State,
  options?: { enableInProduction?: boolean },
): SignalStoreFeature<
  SignalStoreFeatureResult,
  EmptyFeatureResult & { state: State }
>;
/**
 * Prevents mutation of the state.
 *
 * This is done by applying `Object.freeze` to each root
 * property of the state. Any mutable change within
 * or outside the `SignalStore` will throw an error.
 *
 * Root properties of the state having a primitive data type
 * are not supported.
 *
 *  * For example:
 *
 * ```ts
 * const state = {
 *   // ⛔️ are not frozen -> mutable changes possible
 *   id: 1,
 *
 *   // ✅ are frozen -> mutable changes throw
 *   address: {
 *     street: 'Main St',
 *     city: 'Springfield',
 *   }
 * }
 * ```
 *
 * @param stateFactory a function returning the state object
 * @param options enable protection in production (default: false)
 */
export function withImmutableState<State extends object>(
  stateFactory: () => State,
  options?: { enableInProduction?: boolean },
): SignalStoreFeature<
  SignalStoreFeatureResult,
  EmptyFeatureResult & { state: State }
>;
export function withImmutableState<State extends object>(
  stateOrFactory: State | (() => State),
  options?: { enableInProduction?: boolean },
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
         * const initialState = {user: {id: 1}};
         * signalStore(withImmutableState(initialState));
         *
         * initialState.user.id = 2; // must throw immutability
         * ```
         */
        deepFreeze(
          getState(store) as Record<string | symbol, unknown>,
          stateKeys,
        );

        watchState(store, (state) => {
          deepFreeze(state as Record<string | symbol, unknown>, stateKeys);
        });
      },
    })),
  );
}
