import type { Signal } from "@angular/core";


function getValueFromSymbol(obj: unknown, symbol: symbol) {
  if (typeof obj === 'object' && obj && symbol in obj) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (obj as { [key: symbol]: any })[symbol];
  }
}

export function getStoreSignal(store: unknown): Signal<unknown> {
  const [signalStateKey] = Object.getOwnPropertySymbols(store);
  if (!signalStateKey) {
    throw new Error('Cannot find State Signal');
  }

  return getValueFromSymbol(store, signalStateKey);
}
