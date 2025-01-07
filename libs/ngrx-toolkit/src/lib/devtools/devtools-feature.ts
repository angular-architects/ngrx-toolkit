export const DEVTOOLS_FEATURE = Symbol('DEVTOOLS_FEATURE');

export type Mapper = (state: object) => object;

export type DevtoolsOptions = {
  indexNames: boolean; // defines if names should be indexed.
  map: Mapper; // defines a mapper for the state.
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
  options: Partial<DevtoolsOptions>
): DevtoolsFeature {
  return {
    [DEVTOOLS_FEATURE]: true,
    ...options,
  };
}
