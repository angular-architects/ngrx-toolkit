import {
  PartialStateUpdater,
  patchState as originalPatchState,
  signalState,
  signalStore,
  signalStoreFeature,
  SignalStoreFeature,
  withState,
} from '@ngrx/signals';
import { SignalStoreFeatureResult } from '@ngrx/signals/src/signal-store-models';
import { effect, inject, PLATFORM_ID, signal, Signal } from '@angular/core';
import { isPlatformServer } from '@angular/common';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: {
      connect: (options: { name: string }) => {
        send: (action: Action) => void;
      };
    };
  }
}

/**
 * `storeRegistry` holds
 */

type EmptyFeatureResult = { state: {}; signals: {}; methods: {} };
type Action = { type: string };

const storeRegistry = signal<Record<string, Signal<unknown>>>({});

let currentActionNames = new Set<string>();

let synchronizationInitialized = false;

function initSynchronization() {
  effect(() => {
    if (!connection) {
      return;
    }

    const stores = storeRegistry();
    const rootState: Record<string, unknown> = {};
    for (const name in stores) {
      const store = stores[name];
      rootState[name] = store();
    }

    const names = Array.from(currentActionNames);
    const type = names.length ? names.join(', ') : 'Store Update';
    currentActionNames = new Set<string>();

    connection.send({ type }, rootState);
  });
}

function getValueFromSymbol(obj: unknown, symbol: symbol) {
  if (typeof obj === 'object' && obj && symbol in obj) {
    return (obj as { [key: symbol]: any })[symbol];
  }
}

function getStoreSignal(store: unknown): Signal<unknown> {
  const [signalStateKey] = Object.getOwnPropertySymbols(store);
  if (!signalStateKey) {
    throw new Error('Cannot find State Signal');
  }

  return getValueFromSymbol(store, signalStateKey);
}

type ConnectResponse = {
  send: (action: Action, state: unknown) => void;
};
let connection: ConnectResponse | undefined;

/**
 * @param name store's name as it should appear in the DevTools
 */
export function withDevtools<Input extends SignalStoreFeatureResult>(
  name: string
): SignalStoreFeature<Input, EmptyFeatureResult> {
  return (store) => {
    const isServer = isPlatformServer(inject(PLATFORM_ID));
    if (isServer || !window.__REDUX_DEVTOOLS_EXTENSION__) {
      return store;
    }

    if (!connection) {
      connection = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: 'NgRx Signal Store',
      });
    }

    const storeSignal = getStoreSignal(store);
    storeRegistry.update((value) => ({
      ...value,
      [name]: storeSignal,
    }));

    if (!synchronizationInitialized) {
      initSynchronization();
      synchronizationInitialized = true;
    }

    return store;
  };
}

type PatchFn = typeof originalPatchState extends (
  arg1: infer First,
  ...args: infer Rest
) => infer Returner
  ? (state: First, action: string, ...rest: Rest) => Returner
  : never;

export const patchState: PatchFn = (state, action, ...rest) => {
  currentActionNames.add(action);
  return originalPatchState(state, ...rest);
};
