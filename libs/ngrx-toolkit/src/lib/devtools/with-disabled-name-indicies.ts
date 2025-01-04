import { createDevtoolsFeature } from './devtools-feature';

/**
 * If multiple instances of the same SignalStore class
 * exist, their devtool names are indexed.
 *
 * For example:
 * <pre>
 * const Store = signalStore(
 *   withDevtools('flights')
 * )
 *
 * const store1 = new Store(); // will show up as 'flights'
 * const store2 = new Store(); // will show up as 'flights-1'
 * </pre>
 *
 * With adding `withDisabledNameIndices` to the store:
 * <pre>
 * const Store = signalStore(
 *   withDevtools('flights', withDisabledNameIndices())
 * )
 *
 * const store1 = new Store(); // will show up as 'flights'
 * const store2 = new Store(); //💥 throws an error
 * </pre>
 *
 */
export function withDisabledNameIndices() {
  return createDevtoolsFeature(false);
}
