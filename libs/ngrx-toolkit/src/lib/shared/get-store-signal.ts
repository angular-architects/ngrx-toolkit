import { Signal } from '@angular/core';

/**
 * returns the internal STORE_SIGNAL of the Signal Store.
 * @param store instance of Signal Store
 */
export function getStoreSignal(store: unknown): Signal<unknown> {
  const [signalStateKey] = Object.getOwnPropertySymbols(store);
  if (!signalStateKey) {
    throw new Error('Cannot find State Signal');
  }

  return getValueFromSymbol(store, signalStateKey);
}

function getValueFromSymbol(obj: unknown, symbol: symbol): Signal<unknown> {
  if (typeof obj === 'object' && obj && symbol in obj) {
    return (obj as { [key: symbol]: Signal<unknown> })[symbol];
  }

  throw new Error('cannot find Symbol %o' + symbol.toString());
}
