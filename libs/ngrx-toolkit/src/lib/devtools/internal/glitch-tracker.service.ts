import { Injectable } from '@angular/core';
import { getState, StateSource, watchState } from '@ngrx/signals';
import { throwIfNull } from '../../shared/throw-if-null';
import { Tracker, TrackerStores } from './models';

type Stores = Record<
  string,
  { destroyWatcher: () => void; store: StateSource<object> }
>;

/**
 * Internal Service used by {@link withGlitchTracking}. It does not rely
 * on `effect` as {@link DefaultTracker} does but uses the NgRx function
 * `watchState` to track all state changes.
 */
@Injectable({ providedIn: 'root' })
export class GlitchTrackerService implements Tracker {
  #stores: Stores = {};
  #callback: ((changedState: Record<string, object>) => void) | undefined;

  get stores() {
    return Object.entries(this.#stores).reduce((acc, [id, { store }]) => {
      acc[id] = store;
      return acc;
    }, {} as TrackerStores);
  }

  onChange(callback: (changedState: Record<string, object>) => void): void {
    this.#callback = callback;
  }

  removeStore(id: string): void {
    this.#stores = Object.entries(this.#stores).reduce(
      (newStore, [storeId, value]) => {
        if (storeId !== id) {
          newStore[storeId] = value;
        } else {
          value.destroyWatcher();
        }
        return newStore;
      },
      {} as Stores,
    );

    throwIfNull(this.#callback)({});
  }

  track(id: string, store: StateSource<object>): void {
    const watcher = watchState(store, (state) => {
      throwIfNull(this.#callback)({ [id]: state });
    });

    this.#stores[id] = { destroyWatcher: watcher.destroy, store };
  }

  notifyRenamedStore(id: string): void {
    if (Object.keys(this.#stores).includes(id) && this.#callback) {
      this.#callback({ [id]: getState(this.#stores[id].store) });
    }
  }
}
