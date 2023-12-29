import { patchState as originalPatchState } from '@ngrx/signals';
import { currentActionNames } from './internal/currrent-action-names';

type PatchFn = typeof originalPatchState extends (
  arg1: infer First,
  ...args: infer Rest
) => infer Returner
  ? (state: First, action: string, ...rest: Rest) => Returner
  : never;

/**
 * wrapper function for `patchState` action name for
 * devtools.
 * @param state current state
 * @param action name of the action for DevTools
 * @param rest updateFns or patchedValues
 */
export const patchState: PatchFn = (state, action, ...rest) => {
  currentActionNames.add(action);
  return originalPatchState(state, ...rest);
};
