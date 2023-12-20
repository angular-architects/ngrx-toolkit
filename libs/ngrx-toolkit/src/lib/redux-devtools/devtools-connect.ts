import { getConnection, getRootState, initDevtools, setUntrackedStore, updateStoreRegistry } from "./devtools-core";
import { Action } from "./model";
import { getStoreSignal } from "./util";


/**
 * Devtools Public API: Add Store, Dispatch Action
 */
export function addStoreToReduxDevtools(store: unknown, name: string, live = true): boolean {
  if (!initDevtools()) {
    return false;
  }

  !live && setUntrackedStore(name);
  const storeSignal = getStoreSignal(store);
  updateStoreRegistry((value) => ({
    ...value,
    [name]: storeSignal
  }));

  return true;
}

export function dispatchActionToReduxDevtools(action: Action): void {
  getConnection()?.send(action, getRootState());
}
