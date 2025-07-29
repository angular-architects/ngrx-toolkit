import { ActionsFnSpecs } from '../with-redux';

export function assertActionFnSpecs(
  obj: unknown,
): asserts obj is ActionsFnSpecs {
  if (!obj || typeof obj !== 'object') {
    throw new Error('%o is not an Action Specification');
  }
}
