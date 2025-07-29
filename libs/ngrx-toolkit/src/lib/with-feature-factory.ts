import {
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
} from '@ngrx/signals';

type StoreForFactory<Input extends SignalStoreFeatureResult> = StateSignals<
  Input['state']
> &
  Input['props'] &
  Input['methods'];

/**
 * @deprecated Use `import { withFeature } from '@ngrx/signals'` instead, starting with `ngrx/signals` 19.1: https://ngrx.io/guide/signals/signal-store/custom-store-features#connecting-a-custom-feature-with-the-store
 *
 * Allows to pass properties, methods, or signals from a SignalStore
 * to a feature.
 *
 * Typically, a `signalStoreFeature` can have input constraints on
 *
 * ```typescript
 * function withSum(a: Signal<number>, b: Signal<number>) {
 *   return signalStoreFeature(
 *     withComputed(() => ({
 *       sum: computed(() => a() + b())
 *     }))
 *   );
 * }
 *
 * signalStore(
 *   withState({ a: 1, b: 2 }),
 *   withFeatureFactory((store) => withSum(store.a, store.b))
 * );
 * ```
 * @param factoryFn
 */
export function withFeatureFactory<
  Input extends SignalStoreFeatureResult,
  Output extends SignalStoreFeatureResult
>(
  factoryFn: (
    store: StoreForFactory<Input>
  ) => SignalStoreFeature<Input, Output>
): SignalStoreFeature<Input, Output> {
  return (store) => {
    const storeForFactory = {
      ...store['stateSignals'],
      ...store['props'],
      ...store['methods'],
    } as StoreForFactory<Input>;

    const feature = factoryFn(storeForFactory);

    return feature(store);
  };
}
