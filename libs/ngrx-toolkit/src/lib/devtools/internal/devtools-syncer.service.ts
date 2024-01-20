import {
  effect,
  inject,
  Injectable,
  OnDestroy,
  PLATFORM_ID,
  Signal,
  signal,
} from '@angular/core';
import { throwIfNull } from '../../shared/throw-if-null';
import { currentActionNames } from './currrent-action-names';
import { isPlatformServer } from '@angular/common';

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
@Injectable({
  providedIn: 'root',
  useFactory: () => {
    const isServer = isPlatformServer(inject(PLATFORM_ID));
    if (isServer) {
      return new DummyDevtoolsSyncer();
    }

    const isToolkitMissing = !window.__REDUX_DEVTOOLS_EXTENSION__;
    if (isToolkitMissing) {
      return new DummyDevtoolsSyncer();
    }

    return new DefaultDevtoolsSyncer();
  },
})
export abstract class DevtoolsSyncer implements OnDestroy {
  abstract addStore(name: string, store: Signal<unknown>): void;

  abstract removeStore(name: string): void;

  abstract renameStore(currentName: string, newName: string): void;

  abstract ngOnDestroy(): void;
}

class DummyDevtoolsSyncer implements DevtoolsSyncer {
  addStore(): void {}

  removeStore(): void {}

  renameStore(): void {}

  ngOnDestroy(): void {}
}

@Injectable()
class DefaultDevtoolsSyncer implements OnDestroy {
  readonly #stores = signal<Record<string, Signal<unknown>>>({});
  readonly #connection = throwIfNull(
    window.__REDUX_DEVTOOLS_EXTENSION__,
  ).connect({
    name: 'NgRx Signal Store',
  });
  // keeps track of names which have already been synced. Synced names cannot be renamed
  readonly #syncedStoreNames = new Set();

  constructor() {
    effect(() => {
      if (!this.#connection) {
        return;
      }

      const stores = this.#stores();
      const rootState: Record<string, unknown> = {};
      for (const name in stores) {
        this.#syncedStoreNames.add(name);
        const store = stores[name];
        rootState[name] = store();
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

  addStore(name: string, store: Signal<unknown>) {
    this.#stores.update((stores) => ({ ...stores, [name]: store }));
  }

  removeStore(name: string) {
    this.#stores.update((stores) => {
      const newStore: Record<string, Signal<unknown>> = {};
      for (const storeName in stores) {
        if (storeName !== name) {
          newStore[storeName] = stores[storeName];
        }
      }

      return newStore;
    });
  }

  renameStore(oldName: string, newName: string) {
    if (this.#syncedStoreNames.has(oldName)) {
      throw new Error(
        `NgRx Toolkit/DevTools: cannot rename from ${oldName} to ${newName}. ${oldName} has already been send to DevTools.`,
      );
    }

    this.#stores.update((stores) => {
      const newStore: Record<string, Signal<unknown>> = {};
      for (const storeName in stores) {
        if (storeName === newName) {
          throw new Error(
            `NgRx Toolkit/DevTools: cannot rename from ${oldName} to ${newName}. ${newName} already exists.`,
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
