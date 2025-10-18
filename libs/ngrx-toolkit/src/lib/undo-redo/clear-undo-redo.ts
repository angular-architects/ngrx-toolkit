import { StateSource } from '@ngrx/signals';
import { StackItem } from './models/stack-item';

export type ClearUndoRedoOptions = {
  lastRecord: StackItem | null;
};

export type ClearUndoRedoFn = (opts?: ClearUndoRedoOptions) => void;

export function clearUndoRedo<State extends object>(
  store: StateSource<State>,
  opts?: ClearUndoRedoOptions,
): void {
  if (canClearUndoRedo(store)) {
    store.__clearUndoRedo__(opts);
  } else {
    throw new Error(
      'Cannot clear undoRedo, since store is not configured with withUndoRedo()',
    );
  }
}

function canClearUndoRedo<TState extends object>(
  store: StateSource<TState>,
): store is StateSource<TState> & { __clearUndoRedo__: ClearUndoRedoFn } {
  if (
    '__clearUndoRedo__' in store &&
    typeof store.__clearUndoRedo__ === 'function'
  ) {
    return true;
  } else {
    return false;
  }
}
