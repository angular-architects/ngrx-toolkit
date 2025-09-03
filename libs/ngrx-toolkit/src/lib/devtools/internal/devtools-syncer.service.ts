import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { StateSource } from '@ngrx/signals';
import { throwIfNull } from '../../shared/throw-if-null';
import { REDUX_DEVTOOLS_CONFIG } from '../provide-devtools-config';
import { currentActionNames } from './current-action-names';
import { DevtoolsInnerOptions } from './devtools-feature';
import { Connection, StoreRegistry, Tracker } from './models';

const dummyConnection: Connection = {
  send: () => true,
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
  /**
   * Stores all SignalStores that are connected to the
   * DevTools along their options, names and id.
   */
  #stores: StoreRegistry = {};
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #trackers: Tracker[] = [];
  readonly #devtoolsConfig = {
    name: 'NgRx SignalStore',
    ...inject(REDUX_DEVTOOLS_CONFIG, { optional: true }),
  };

  /**
   * Maintains the current states of all stores to avoid conflicts
   * between glitch-free and glitched trackers when used simultaneously.
   *
   * The challenge lies in ensuring that glitched trackers do not
   * interfere with the synchronization process of glitch-free trackers.
   * Specifically, glitched trackers could cause the synchronization to
   * read the current state of stores managed by glitch-free trackers.
   *
   * Therefore, the synchronization process doesn't read the state from
   * each store, but relies on #currentState.
   *
   * Please note, that here the key is the name and not the id.
   */
  #currentState: Record<string, object> = {};
  #currentId = 1;

  readonly #connection: Connection = this.#isBrowser
    ? this.#initDevtoolsConnection()
    : dummyConnection;

  constructor() {
    if (!this.#isBrowser) {
      console.warn(
        '[DevtoolsSyncer] Not running in browser. DevTools disabled.',
      );
    }
  }

  ngOnDestroy(): void {
    currentActionNames.clear();
  }

  #initDevtoolsConnection(): Connection {
    const extension = window.__REDUX_DEVTOOLS_EXTENSION__;
    if (!extension) {
      console.warn('[DevtoolsSyncer] Redux DevTools extension not found.');
      return dummyConnection;
    }

    try {
      if (typeof extension.connect === 'function') {
        return extension.connect(this.#devtoolsConfig);
      } else {
        console.warn(
          '[DevtoolsSyncer] Redux DevTools extension does not support .connect()',
        );
      }
    } catch (error) {
      console.error(
        '[DevtoolsSyncer] Error connecting to Redux DevTools:',
        error,
      );
      return dummyConnection;
    }

    return dummyConnection;
  }

  syncToDevTools(changedStatePerId: Record<string, object>) {
    const mappedChangedStatePerName = Object.entries(changedStatePerId).reduce(
      (acc, [id, store]) => {
        const { options, name } = this.#stores[id];
        acc[name] = options.map(store);
        return acc;
      },
      {} as Record<string, object>,
    );

    this.#currentState = {
      ...this.#currentState,
      ...mappedChangedStatePerName,
    };

    const names = Array.from(currentActionNames);
    const type = names.length ? names.join(', ') : 'Store Update';
    currentActionNames.clear();

    this.#connection.send({ type }, this.#currentState);
  }

  getNextId(): string {
    return String(this.#currentId++);
  }

  /**
   * Consumer provides the id. That is because we can only start
   * tracking the store in the init hook.
   * Unfortunately, methods for renaming having the final id
   * need to be defined already before.
   * That's why `withDevtools` requests first the id and
   * then registers itself later.
   */
  addStore(
    id: string,
    name: string,
    store: StateSource<object>,
    options: DevtoolsInnerOptions,
  ) {
    let storeName = name;
    const names = Object.values(this.#stores).map((s) => s.name);

    if (names.includes(storeName) && !options.indexNames) {
      throw new Error(`An instance of the store ${storeName} already exists. \
Enable automatic indexing via withDevTools('${storeName}', { indexNames: true }), or rename it upon instantiation.`);
    }

    for (let i = 1; names.includes(storeName); i++) {
      storeName = `${name}-${i}`;
    }

    this.#stores[id] = { name: storeName, options };

    const tracker = options.tracker;
    if (!this.#trackers.includes(tracker)) {
      this.#trackers.push(tracker);
    }

    tracker.onChange((changedState) => this.syncToDevTools(changedState));
    tracker.track(id, store);
  }

  removeStore(id: string) {
    const name = this.#stores[id]?.name;

    this.#stores = Object.entries(this.#stores).reduce(
      (acc, [storeId, value]) => {
        if (storeId !== id) acc[storeId] = value;
        return acc;
      },
      {} as StoreRegistry,
    );

    this.#currentState = Object.entries(this.#currentState).reduce(
      (acc, [storeName, state]) => {
        if (storeName !== name) acc[storeName] = state;
        return acc;
      },
      {} as Record<string, object>,
    );

    for (const tracker of this.#trackers) {
      tracker.removeStore(id);
    }
  }

  renameStore(oldName: string, newName: string) {
    const storeNames = Object.values(this.#stores).map((s) => s.name);
    const id = throwIfNull(
      Object.keys(this.#stores).find(
        (key) => this.#stores[key].name === oldName,
      ),
    );

    if (storeNames.includes(newName)) {
      throw new Error(
        `NgRx Toolkit/DevTools: cannot rename from ${oldName} to ${newName}. ${newName} is already assigned to another SignalStore instance.`,
      );
    }

    this.#stores = Object.entries(this.#stores).reduce((acc, [key, value]) => {
      acc[key] = value.name === oldName ? { ...value, name: newName } : value;
      return acc;
    }, {} as StoreRegistry);

    // we don't rename in #currentState but wait for tracker to notify
    // us with a changed state that contains that name.
    this.#currentState = Object.entries(this.#currentState).reduce(
      (acc, [storeName, state]) => {
        if (storeName !== oldName) acc[storeName] = state;
        return acc;
      },
      {} as Record<string, object>,
    );

    this.#trackers.forEach((tracker) => tracker.notifyRenamedStore(id));
  }
}
