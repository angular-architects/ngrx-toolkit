import { patchState as originalPatchState } from '@ngrx/signals';
import { PartialStateUpdater, WritableStateSource } from '@ngrx/signals';
import { Prettify } from '../shared/prettify';
import { currentActionNames } from './internal/currrent-action-names';

type PatchFn = typeof originalPatchState extends (
  arg1: infer First,
  ...args: infer Rest
) => infer Returner
  ? (state: First, action: string, ...rest: Rest) => Returner
  : never;

/**
 * @deprecated Has been renamed to `updateState`
 */
export const patchState: PatchFn = (state, action, ...rest) => {
  updateState(state, action, ...rest);
};

/**
 * Wrapper of `patchState` for DevTools integration. Next to updating the state,
 * it also sends the action to the DevTools.
 * @param stateSource state of Signal Store
 * @param action name of action how it will show in DevTools
 * @param updaters updater functions or objects
 */
export function updateState<State extends object>(
  stateSource: WritableStateSource<State>,
  action: string,
  ...updaters: Array<
    Partial<Prettify<State>> | PartialStateUpdater<Prettify<State>>
  >
): void {
  currentActionNames.add(action);
  return originalPatchState(stateSource, ...updaters);
}
