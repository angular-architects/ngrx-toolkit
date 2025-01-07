import {
  inject,
  Injectable,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { currentActionNames } from './current-action-names';
import { isPlatformBrowser } from '@angular/common';
import { getState, StateSource } from '@ngrx/signals';
import { DevtoolsInnerOptions } from './devtools-feature';
import { throwIfNull } from '../../shared/throw-if-null';
import { Connection, StoreRegistry, Tracker } from './models';

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
  readonly #trackers = [] as Tracker[];
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
  }

  ngOnDestroy(): void {
    currentActionNames.clear();
  }

  addStore(
    name: string,
    store: StateSource<object>,
    options: DevtoolsInnerOptions
  ) {
    let storeName = name;
    const names = Object.values(this.#stores()).map((store) => store.name);

    if (names.includes(storeName)) {
      const { options } = throwIfNull(
        Object.values(this.#stores()).find((store) => store.name === storeName)
      );
      if (!options.indexNames) {
        throw new Error(`An instance of the store ${storeName} already exists. \
Enable automatic indexing via withDevTools('${storeName}', { indexNames: true }), or rename it upon instantiation.`);
      }
    }

    for (let i = 1; names.includes(storeName); i++) {
      storeName = `${name}-${i}`;
    }
    const id = String(this.#currentId++);
    this.#stores.update((stores) => ({
      ...stores,
      [id]: { name: storeName, options },
    }));

    const tracker = options.tracker;
    if (!this.#trackers.includes(tracker)) {
      this.#trackers.push(tracker);
    }

    tracker.track(id, store);
    tracker.onChange(() => this.syncToDevTools());

    return id;
  }

  syncToDevTools() {
    const trackerStores = this.#trackers.reduce(
      (acc, tracker) => ({ ...acc, ...tracker.getStores() }),
      {} as Record<string, StateSource<object>>
    );
    const rootState = Object.entries(trackerStores).reduce(
      (acc, [id, store]) => {
        const { options, name } = this.#stores()[id];
        acc[name] = options.map(getState(store));
        return acc;
      },
      {} as Record<string, unknown>
    );

    const names = Array.from(currentActionNames);
    const type = names.length ? names.join(', ') : 'Store Update';
    currentActionNames.clear();

    this.#connection.send({ type }, rootState);
  }

  removeStore(id: string) {
    for (const tracker of this.#trackers) {
      tracker.removeStore(id);
    }
    this.#stores.update((stores) =>
      Object.entries(stores).reduce((newStore, [storeId, value]) => {
        if (storeId !== id) {
          newStore[storeId] = value;
        }
        return newStore;
      }, {} as StoreRegistry)
    );
  }

  renameStore(oldName: string, newName: string) {
    this.#stores.update((stores) => {
      const storeNames = Object.values(stores).map((store) => store.name);
      if (storeNames.includes(newName)) {
        throw new Error(
          `NgRx Toolkit/DevTools: cannot rename from ${oldName} to ${newName}. ${newName} is already assigned to another SignalStore instance.`
        );
      }

      return Object.entries(stores).reduce((newStore, [id, value]) => {
        if (value.name === oldName) {
          newStore[id] = { ...value, name: newName };
        } else {
          newStore[id] = value;
        }
        return newStore;
      }, {} as StoreRegistry);
    });
  }
}
