export const DEVTOOLS_FEATURE = Symbol('DEVTOOLS_FEATURE');

/**
 * A DevtoolsFeature adds or modifies the behavior of the
 * devtools extension.
 *
 * We use them (function calls) instead of a config object,
 * because of tree-shaking.
 */
export interface DevtoolsFeature {
  [DEVTOOLS_FEATURE]: true;
  indexNames: boolean | undefined; // defines if names should be indexed.
}

export function createDevtoolsFeature(indexNames = true): DevtoolsFeature {
  return {
    [DEVTOOLS_FEATURE]: true,
    indexNames,
  };
}
