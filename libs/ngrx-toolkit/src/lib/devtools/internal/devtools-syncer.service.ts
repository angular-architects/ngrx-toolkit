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
import { Connection } from '../with-devtools';
import { getState, StateSource } from '@ngrx/signals';
import { DevtoolsOptions } from '../devtools-feature';

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
  #currentId = 1;

  readonly #connection: Connection = this.#isBrowser
    ? window.__REDUX_DEVTOOLS_EXTENSION__
      ? window.__REDUX_DEVTOOLS_EXTENSION__.connect({
          name: 'NgRx SignalStore',
        })
      : dummyConnection
    : dummyConnection;

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
        const { store, options } = stores[name];
        rootState[name] = options.map(getState(store));
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
    const id = this.#currentId++;

    this.#stores.update((stores) => ({
      ...stores,
      [storeName]: { store, options, id },
    }));

    return id;
  }

  removeStore(id: number) {
    this.#stores.update((stores) => {
      return Object.entries(stores).reduce((newStore, [name, value]) => {
        if (value.id === id) {
          return newStore;
        } else {
          return { ...newStore, [name]: value };
        }
      }, {});
    });
  }

  renameStore(oldName: string, newName: string) {
    this.#stores.update((stores) => {
      if (newName in stores) {
        throw new Error(
          `NgRx Toolkit/DevTools: cannot rename from ${oldName} to ${newName}. ${newName} is already assigned to another SignalStore instance.`
        );
      }

      const newStore: StoreRegistry = {};
      for (const storeName in stores) {
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
  {
    store: StateSource<object>;
    options: DevtoolsOptions;
    id: number;
  }
>;
