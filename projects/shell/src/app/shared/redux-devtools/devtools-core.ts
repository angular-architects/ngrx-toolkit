import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID, Signal, effect, inject, signal, untracked } from '@angular/core';
import { ConnectResponse } from './model';


/**
 * `storeRegistry` holds
 */


/**
 * Local State
 */
let connection: ConnectResponse | undefined;

const storeRegistry = signal<Record<string, Signal<unknown>>>({});
const untrackedStores: Record<string, boolean> = {};
let currentActionNames = new Set<string>();
let synchronizationInitialized = false;

const DEFAULT_ACTION_NAME = 'Store Update';
const DEFAULT_STORE_NAME = 'NgRx Signal Store';

/**
 * Devtools Core Getter, Setter
 */
export function addActionName(action: string): void {
  currentActionNames.add(action);
}

export function getConnection(): ConnectResponse | undefined {
  return connection;
}

export function updateStoreRegistry(
  updateFn: (value: Record<string, Signal<unknown>>) => Record<string, Signal<unknown>>
): void {
  storeRegistry.update(updateFn);
}

export function setUntrackedStore(name: string) {
  untrackedStores[name] = true;
}

export function getRootState(): Record<string, unknown> {
  const stores = storeRegistry();
  const rootState: Record<string, unknown> = {};
  for (const name in stores) {
    const store = stores[name];
    rootState[name] = untrackedStores[name]
      ? untracked(() => store())
      : store();
  }

  return rootState;
}

/**
 * Devtools Core Internals
 */
function initConnection(): void {
  if (!connection) {
    connection = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: DEFAULT_STORE_NAME,
    });
  }
}

function initSynchronization(): void {
  let rootState: unknown = undefined;
  const shouldSend = (newState: unknown) =>
    rootState && rootState !== newState;

  if (!synchronizationInitialized) {
    effect(() => {
      if (!connection) {
        return;
      }

      const names = Array.from(currentActionNames);
      const type = names.length ? names.join(', ') : DEFAULT_ACTION_NAME;
      currentActionNames = new Set<string>();

      const state = getRootState();
      if (shouldSend(state)) {
        connection.send({ type }, state);
      }
    });

    synchronizationInitialized = true;
  }
}

function isServerOrDevtoolsMissing(): boolean {
  const isServer = isPlatformServer(inject(PLATFORM_ID));
  if (isServer || !window.__REDUX_DEVTOOLS_EXTENSION__) {
    return true;
  }

  return false;
}

/**
 * Devtools Core API
 */
export function initDevtools(): boolean {
  if (isServerOrDevtoolsMissing()) {
    return false;
  }

  initConnection();
  initSynchronization();

  return true;
}
