import { createDevtoolsFeature } from '../internal/devtools-feature';

/**
 * If multiple instances of the same SignalStore class
 * exist, their devtool names are indexed.
 *
 * For example:
 *
 * ```typescript
 * const Store = signalStore(
 *   withDevtools('flights')
 * )
 *
 * const store1 = new Store(); // will show up as 'flights'
 * const store2 = new Store(); // will show up as 'flights-1'
 * ```
 *
 * With adding `withDisabledNameIndices` to the store:
 * ```typescript
 * const Store = signalStore(
 *   withDevtools('flights', withDisabledNameIndices())
 * )
 *
 * const store1 = new Store(); // will show up as 'flights'
 * const store2 = new Store(); //💥 throws an error
 * ```
 *
 */
export function withDisabledNameIndices() {
  return createDevtoolsFeature({ indexNames: false });
}
