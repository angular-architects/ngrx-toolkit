import {
  effect,
  inject,
  Injectable,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { currentActionNames } from './currrent-action-names';
import { isPlatformBrowser } from '@angular/common';
import { Connection, DevtoolsOptions } from '../with-devtools';
import { getState, StateSource } from '@ngrx/signals';

const dummyConnection: Connection = {
  send: () => void true,
};

/**
 * A service provided by the root injector is
 * required because the synchronization runs
 * globally.
 *
 * The SignalStore could be provided in a component.
 * If the effect starts in the injection
 * context of the SignalStore, the complete sync
 * process would shut down once the component gets
 * destroyed.
 */
@Injectable({ providedIn: 'root' })
export class DevtoolsSyncer implements OnDestroy {
  readonly #stores = signal<StoreRegistry>({});
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly #connection: Connection = this.#isBrowser
    ? window.__REDUX_DEVTOOLS_EXTENSION__
      ? window.__REDUX_DEVTOOLS_EXTENSION__.connect({
          name: 'NgRx SignalStore',
        })
      : dummyConnection
    : dummyConnection;

  // keeps track of names which have already been synced. Synced names cannot be renamed
  readonly #syncedStoreNames = new Set();

  constructor() {
    if (!this.#isBrowser) {
      return;
    }

    const isToolkitAvailable = Boolean(window.__REDUX_DEVTOOLS_EXTENSION__);
    if (!isToolkitAvailable) {
      throw new Error(
        'NgRx Toolkit/DevTools: Redux DevTools Extension is not available.'
      );
    }

    effect(() => {
      if (!this.#connection) {
        return;
      }

      const stores = this.#stores();
      const rootState: Record<string, unknown> = {};
      for (const name in stores) {
        this.#syncedStoreNames.add(name);
        const { store } = stores[name];
        rootState[name] = getState(store);
      }

      const names = Array.from(currentActionNames);
      const type = names.length ? names.join(', ') : 'Store Update';
      currentActionNames.clear();

      this.#connection.send({ type }, rootState);
    });
  }

  ngOnDestroy(): void {
    currentActionNames.clear();
  }

  addStore(name: string, store: StateSource<object>, options: DevtoolsOptions) {
    let storeName = name;
    const names = Object.keys(this.#stores());

    if (names.includes(storeName)) {
      const { options } = this.#stores()[storeName];
      if (!options.indexNames) {
        throw new Error(`An instance of the store ${storeName} already exists. \
Enable automatic indexing via withDevTools('${storeName}', { indexNames: true }), or rename it upon instantiation.`);
      }
    }

    for (let i = 1; names.includes(storeName); i++) {
      storeName = `${name}-${i}`;
    }

    this.#stores.update((stores) => ({
      ...stores,
      [storeName]: { store, options },
    }));
  }

  removeStore(name: string) {
    this.#stores.update((value) => {
      const newStore: StoreRegistry = {};
      for (const storeName in value) {
        if (storeName !== name) {
          newStore[storeName] = value[storeName];
        }
      }

      return newStore;
    });
  }

  renameStore(oldName: string, newName: string) {
    if (this.#syncedStoreNames.has(oldName)) {
      throw new Error(
        `NgRx Toolkit/DevTools: cannot rename from ${oldName} to ${newName}. ${oldName} has already been send to DevTools.`
      );
    }

    this.#stores.update((stores) => {
      const newStore: StoreRegistry = {};
      for (const storeName in stores) {
        if (storeName === newName) {
          throw new Error(
            `NgRx Toolkit/DevTools: cannot rename from ${oldName} to ${newName}. ${newName} already exists.`
          );
        }
        if (storeName === oldName) {
          newStore[newName] = stores[oldName];
        } else {
          newStore[storeName] = stores[storeName];
        }
      }

      return newStore;
    });
  }
}

type StoreRegistry = Record<
  string,
  { store: StateSource<object>; options: DevtoolsOptions }
>;
