import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { getState, patchState, signalStore, withState } from '@ngrx/signals';
import { TestBed } from '@angular/core/testing';
import { withStorageSync } from '../with-storage-sync';
import { AsyncStorageStrategy, SyncStorageStrategy } from '../internal/models';
import { withIndexeddb } from '../features/with-indexeddb';
import { withLocalStorage } from '../features/with-local-storage';

interface StateObject {
  name: string;
  age: number;
}

const initialState: StateObject = {
  name: 'Delta',
  age: 52,
};

type ParamStorageStrategy = () => AsyncStorageStrategy<StateObject> &
  SyncStorageStrategy<StateObject>;
type Params = {
  name: string;
  storageStrategy: ParamStorageStrategy;
  type: 'sync' | 'async';
}[];

const params: Params = [
  {
    name: 'localStorage',
    storageStrategy: withLocalStorage as ParamStorageStrategy,
    type: 'sync',
  },
  {
    name: 'indexeddb',
    storageStrategy: withIndexeddb as ParamStorageStrategy,
    type: 'async',
  },
];

describe('withStorageSync', () => {
  params.forEach(({ name, storageStrategy, type }) => {
    describe(name, () => {
      it(`synchronizes automatically`, async () => {
        const Store = signalStore(
          { protectedState: false },
          withState({ name: 'Delta', age: 52 }),
          withStorageSync('flights', storageStrategy())
        );

        const injector1 = createEnvironmentInjector(
          [Store],
          TestBed.inject(EnvironmentInjector)
        );
        const injector2 = createEnvironmentInjector(
          [Store],
          TestBed.inject(EnvironmentInjector)
        );

        const store1 = injector1.get(Store);
        patchState(store1, { name: 'Lufthansa', age: 27 });
        injector1.destroy();

        const store2 = injector2.get(Store);
        // await new Promise((resolve) => setTimeout(resolve));
        expect(getState(store2)).toEqual({ name: 'Lufthansa', age: 27 });
      });

      it.todo('reads and writes from two different stores');
      it.todo('use autoSync');
      it.todo('does not automatically read from storage on start');
    });
  });
});
