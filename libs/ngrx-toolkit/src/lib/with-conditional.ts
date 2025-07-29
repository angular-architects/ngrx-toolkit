import {
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
  withState,
} from '@ngrx/signals';

/**
 * `withConditional` activates a feature based on a given condition.
 *
 * **Use Cases**
 * - Conditionally activate features based on the **store state** or other criteria.
 * - Choose between **two different implementations** of a feature.
 *
 * **Type Constraints**
 * Both features must have **exactly the same state, props, and methods**.
 * Otherwise, a type error will occur.
 *
 *
 * **Usage**
 *
 * ```typescript
 * const withUser = signalStoreFeature(
 *   withState({ id: 1, name: 'Konrad' }),
 *   withHooks(store => ({
 *     onInit() {
 *       // user loading logic
 *     }
 *   }))
 * );
 *
 * function withFakeUser() {
 *   return signalStoreFeature(
 *     withState({ id: 0, name: 'anonymous' })
 *   );
 * }
 *
 * signalStore(
 *   withMethods(() => ({
 *     useRealUser: () => true
 *   })),
 *   withConditional((store) => store.useRealUser(), withUser, withFakeUser)
 * )
 * ```
 *
 * @param condition - A function that determines which feature to activate based on the store state.
 * @param featureIfTrue - The feature to activate if the condition evaluates to `true`.
 * @param featureIfFalse - The feature to activate if the condition evaluates to `false`.
 * @returns A `SignalStoreFeature` that applies the selected feature based on the condition.
 */
export function withConditional<
  Input extends SignalStoreFeatureResult,
  Output extends SignalStoreFeatureResult,
>(
  condition: (
    store: StateSignals<Input['state']> & Input['props'] & Input['methods'],
  ) => boolean,
  featureIfTrue: SignalStoreFeature<NoInfer<Input>, Output>,
  featureIfFalse: SignalStoreFeature<NoInfer<Input>, NoInfer<Output>>,
): SignalStoreFeature<Input, Output> {
  return (store) => {
    const conditionStore = {
      ...store['stateSignals'],
      ...store['props'],
      ...store['methods'],
    };
    return condition(conditionStore)
      ? featureIfTrue(store)
      : featureIfFalse(store);
  };
}

export const emptyFeature = signalStoreFeature(withState({}));
