import { Tracker } from './models';

export const DEVTOOLS_FEATURE = Symbol('DEVTOOLS_FEATURE');

export type Mapper = (state: object) => object;

export type DevtoolsOptions = {
  name?: string; // defines the name of the feature
  indexNames?: boolean; // defines if names should be indexed.
  map?: Mapper; // defines a mapper for the state.
  tracker?: new () => Tracker; // defines a tracker for the state
};

export type DevtoolsInnerOptions = {
  indexNames: boolean;
  map: Mapper;
  tracker: Tracker;
};

/**
 * A DevtoolsFeature adds or modifies the behavior of the
 * devtools extension.
 *
 * We use them (function calls) instead of a config object,
 * because of tree-shaking.
 */
export type DevtoolsFeature = {
  [DEVTOOLS_FEATURE]: true;
} & Partial<DevtoolsOptions>;

export function createDevtoolsFeature(
  options: DevtoolsOptions,
): DevtoolsFeature {
  return {
    [DEVTOOLS_FEATURE]: true,
    ...options,
  };
}
