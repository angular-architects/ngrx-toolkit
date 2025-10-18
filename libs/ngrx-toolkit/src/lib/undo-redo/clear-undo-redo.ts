import { StateSource } from '@ngrx/signals';

export type ClearUndoRedoOptions<TState extends object> = {
  lastRecord: TState[keyof TState] | null;
};

export type ClearUndoRedoFn<TState extends object> = (
  opts?: ClearUndoRedoOptions<TState>,
) => void;

export function clearUndoRedo<State extends object>(
  store: StateSource<State>,
  opts?: ClearUndoRedoOptions<State>,
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
): store is StateSource<TState> & {
  __clearUndoRedo__: ClearUndoRedoFn<TState>;
} {
  if (
    '__clearUndoRedo__' in store &&
    typeof store.__clearUndoRedo__ === 'function'
  ) {
    return true;
  } else {
    return false;
  }
}
