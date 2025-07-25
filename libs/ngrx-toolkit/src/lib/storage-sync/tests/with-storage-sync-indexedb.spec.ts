import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getState, patchState, signalStore, withState } from '@ngrx/signals';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { withIndexeddb } from '../features/with-indexeddb';
import { withLocalStorage } from '../features/with-local-storage';
import { AsyncStorageStrategy, SyncStorageStrategy } from '../internal/models';
import { withStorageSync } from '../with-storage-sync';

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

type Param = {
  name: string;
  storageStrategy: ParamStorageStrategy;
  type: 'sync' | 'async';
};

const syncStorageStrategy: Param = {
  name: 'localStorage',
  storageStrategy: withLocalStorage as ParamStorageStrategy,
  type: 'sync',
};

const asyncStorageStrategy: Param = {
  name: 'indexeddb',
  storageStrategy: withIndexeddb as ParamStorageStrategy,
  type: 'async',
};
const params: Param[] = [syncStorageStrategy, asyncStorageStrategy];

const waitForSyncStable = async (store: {
  whenSynced?: () => Promise<void>;
}) => {
  if (store.whenSynced) {
    await store.whenSynced();
  }
};

let warnings = [] as string[];
jest.spyOn(console, 'warn').mockImplementation((...messages: string[]) => {
  warnings.push(...messages);
});

describe('withStorageSync', () => {
  beforeEach(() => {
    console.log('retting warnings');
    globalThis.indexedDB = new IDBFactory();
    warnings = [];
  });

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

        await waitForSyncStable(store1);
        patchState(store1, { name: 'Lufthansa', age: 27 });
        await waitForSyncStable(store1);

        injector1.destroy();

        const store2 = injector2.get(Store);
        await waitForSyncStable(store2);
        expect(getState(store2)).toEqual({ name: 'Lufthansa', age: 27 });
      });
    });
  });

  it('logs when writing happens before state is synchronized', async () => {
    const Store = signalStore(
      { providedIn: 'root', protectedState: false },
      withState({ name: 'Delta', age: 52 }),
      withStorageSync('flights', asyncStorageStrategy.storageStrategy())
    );
    const store = TestBed.inject(Store);

    expect(warnings).toEqual([]);
    patchState(store, { name: 'Lufthansa', age: 27 });
    expect(warnings).toEqual([
      'Writing to Store (flights) happened before the state was initially read from storage.',
      'Please ensure that the store is not in syncing state via `store.whenSynced()` before writing to the state.',
      'Alternatively, you can disable autoSync by passing `autoSync: false` in the config.',
    ]);
  });

  it('warns when reading happens during a write', async () => {
    console.log('starting test');
    const Store = signalStore(
      { providedIn: 'root', protectedState: false },
      withState({ name: 'Delta', age: 52 }),
      withStorageSync('flights', asyncStorageStrategy.storageStrategy())
    );

    const store = TestBed.inject(Store);
    await waitForSyncStable(store);
    patchState(store, { name: 'Lufthansa', age: 27 });
    store.readFromStorage();

    expect(warnings).toEqual([
      'Reading to Store (flights) happened during an ongoing synchronization process.',
      'Please ensure that the store is not in syncing state via `store.whenSynced()`.',
      'Alternatively, you can disable the autoSync by passing `autoSync: false` in the config.',
    ]);
  });

  it('warns when writing happens during a read', async () => {
    const Store = signalStore(
      { providedIn: 'root', protectedState: false },
      withState({ name: 'Delta', age: 52 }),
      withStorageSync('flights', asyncStorageStrategy.storageStrategy())
    );

    const store = TestBed.inject(Store);
    await waitForSyncStable(store);

    store.readFromStorage();
    patchState(store, { name: 'Lufthansa', age: 27 });
    expect(warnings).toEqual([
      'Writing to Store (flights) happened during an ongoing synchronization process.',
      'Please ensure that the store is not in syncing state via `store.whenSynced()`.',
      'Alternatively, you can disable the autoSync by passing `autoSync: false` in the config.',
    ]);
  });
});
