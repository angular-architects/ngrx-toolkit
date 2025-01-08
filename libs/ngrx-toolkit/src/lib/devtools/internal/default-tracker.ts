import { effect, Injectable, signal } from '@angular/core';
import { getState, StateSource } from '@ngrx/signals';
import { Tracker, TrackerStores } from './models';

@Injectable({ providedIn: 'root' })
export class DefaultTracker implements Tracker {
  readonly #stores = signal<TrackerStores>({});

  get stores(): TrackerStores {
    return this.#stores();
  }

  #trackCallback: undefined | ((changedState: Record<string, object>) => void);

  #trackingEffect = effect(() => {
    if (this.#trackCallback === undefined) {
      throw new Error('no callback function defined');
    }
    const stores = this.#stores();

    const fullState = Object.entries(stores).reduce((acc, [id, store]) => {
      return { ...acc, [id]: getState(store) };
    }, {} as Record<string, object>);

    this.#trackCallback(fullState);
  });

  track(id: string, store: StateSource<object>): void {
    this.#stores.update((value) => ({
      ...value,
      [id]: store,
    }));
  }

  onChange(callback: (changedState: Record<string, object>) => void): void {
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

  notifyRenamedStore(id: string): void {
    if (this.#stores()[id]) {
      this.#stores.update((stores) => {
        return { ...stores };
      });
    }
  }
}
