import { effect, Injectable, signal } from '@angular/core';
import { StateSource } from '@ngrx/signals';
import { Tracker, TrackerStores } from './models';

@Injectable({ providedIn: 'root' })
export class DefaultTracker implements Tracker {
  readonly #stores = signal<TrackerStores>({});
  #trackCallback: undefined | (() => void);

  #trackingEffect = effect(() => {
    if (this.#trackCallback === undefined) {
      throw new Error('no callback function defined');
    }
    this.#stores(); // track stores
    this.#trackCallback();
  });

  track(id: string, store: StateSource<object>): void {
    this.#stores.update((value) => ({
      ...value,
      [id]: store,
    }));
  }

  onChange(callback: () => void): void {
    this.#trackCallback = callback;
  }

  removeStore(id: string) {
    this.#stores.update((stores) =>
      Object.entries(stores).reduce((newStore, [storeId, state]) => {
        if (storeId !== id) {
          newStore[storeId] = state;
        }
        return newStore;
      }, {} as TrackerStores)
    );
  }

  getStores(): Record<string, StateSource<object>> {
    return Object.entries(this.#stores()).reduce((states, [key, store]) => {
      states[key] = store;
      return states;
    }, {} as Record<string, StateSource<object>>);
  }
}
