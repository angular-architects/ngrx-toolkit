import { TestBed } from '@angular/core/testing';
import { getState, patchState, signalStore, withState } from '@ngrx/signals';
import 'fake-indexeddb/auto';
import { withIndexedDB } from '../features/with-indexed-db';
import { IndexedDBService } from '../internal/indexeddb.service';
import { withStorageSync } from '../with-storage-sync';

interface StateObject {
  foo: string;
  age: number;
}

const initialState: StateObject = {
  foo: 'bar',
  age: 18,
};
const key = 'FooBar';

const waitForSyncStable = async (store: {
  whenSynced?: () => Promise<void>;
}) => {
  if (store.whenSynced) {
    await store.whenSynced();
  }
};

describe('withStorageSync (async storage)', () => {
  beforeEach(() => {
    // make sure to start with a clean storage
    globalThis.indexedDB = new IDBFactory();
  });

  it('adds methods for storage access to the store', () => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(withStorageSync({ key }, withIndexedDB()));
      const store = new Store();

      expect(Object.keys(store)).toEqual([
        'isSynced',
        'whenSynced',
        'clearStorage',
        'readFromStorage',
        'writeToStorage',
      ]);
    });
  });

  it('offers manual sync using provided methods', async () => {
    TestBed.runInInjectionContext(async () => {
      // prefill storage
      const indexedDBService = TestBed.inject(IndexedDBService);
      await indexedDBService.setItem(
        key,
        JSON.stringify({
          foo: 'baz',
          age: 99,
        }),
      );

      const Store = signalStore(
        { protectedState: false },
        withState(initialState),
        withStorageSync({ key, autoSync: false }, withIndexedDB()),
      );
      const store = TestBed.inject(Store);
      await waitForSyncStable(store);

      expect(getState(store)).toEqual({});

      await store.readFromStorage();

      expect(getState(store)).toEqual({
        foo: 'baz',
        age: 99,
      });

      patchState(store, { ...initialState });
      await waitForSyncStable(store);

      expect(await indexedDBService.getItem(key)).toEqual({
        foo: 'baz',
        age: 99,
      });

      await store.writeToStorage();
      expect(await indexedDBService.getItem(key)).toEqual({
        ...initialState,
      });

      await store.clearStorage();
      expect(await indexedDBService.getItem(key)).toEqual(null);
    });
  });

  describe('autoSync', () => {
    it('inits from storage and write to storage on changes when set to `true`', async () => {
      const indexedDBService = TestBed.inject(IndexedDBService);
      // prefill storage
      await indexedDBService.setItem(
        key,
        JSON.stringify({
          foo: 'baz',
          age: 99,
        } as StateObject),
      );

      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withStorageSync(key, withIndexedDB()),
      );

      const store = TestBed.inject(Store);
      await waitForSyncStable(store);
      expect(getState(store)).toEqual({
        foo: 'baz',
        age: 99,
      });

      patchState(store, { ...initialState });
      await waitForSyncStable(store);

      expect(getState(store)).toEqual({
        ...initialState,
      });

      expect(await indexedDBService.getItem(key)).toEqual(
        JSON.stringify(initialState),
      );
    });

    it('does not init from storage and does write to storage on changes when set to `false`', async () => {
      const indexedDBService = TestBed.inject(IndexedDBService);
      await indexedDBService.setItem(
        key,
        JSON.stringify({
          foo: 'baz',
          age: 99,
        }),
      );

      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withStorageSync({ key, autoSync: false }, withIndexedDB()),
      );
      const store = TestBed.inject(Store);
      expect(store.isSynced()).toBe(false);
      expect(getState(store)).toEqual({});

      patchState(store, { ...initialState });
      expect(store.isSynced()).toBe(false);

      const storeItem = JSON.parse(
        (await indexedDBService.getItem(key)) || '{}',
      );
      expect(storeItem).toEqual({
        foo: 'baz',
        age: 99,
      });
    });
  });

  describe('select', () => {
    it('syncs the whole state by default', async () => {
      const indexedDBService = TestBed.inject(IndexedDBService);
      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withStorageSync(key, withIndexedDB()),
      );
      const store = TestBed.inject(Store);
      await waitForSyncStable(store);

      patchState(store, { foo: 'baz', age: 25 });
      await waitForSyncStable(store);

      expect(await indexedDBService.getItem(key)).toEqual(
        JSON.stringify({ foo: 'baz', age: 25 }),
      );
    });

    it('syncs selected slices when specified', async () => {
      const indexedDBService = TestBed.inject(IndexedDBService);
      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withStorageSync(
          { key, select: ({ foo }) => ({ foo }) },
          withIndexedDB(),
        ),
      );
      const store = TestBed.inject(Store);
      await waitForSyncStable(store);

      patchState(store, { foo: 'baz' });
      await waitForSyncStable(store);

      const storeItem = JSON.parse(
        (await indexedDBService.getItem(key)) || '{}',
      );
      expect(storeItem).toEqual({
        foo: 'baz',
      });
    });
  });

  describe('parse/stringify', () => {
    it('uses custom parsing/stringification when specified', async () => {
      const indexedDBService = TestBed.inject(IndexedDBService);
      const parse = (stateString: string) => {
        const [foo, age] = stateString.split('_');
        return {
          foo,
          age: +age,
        };
      };

      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withStorageSync(
          {
            key,
            parse,
            stringify: (state) => `${state.foo}_${state.age}`,
          },
          withIndexedDB(),
        ),
      );

      const store = TestBed.inject(Store);
      await waitForSyncStable(store);
      patchState(store, { foo: 'baz' });
      await waitForSyncStable(store);

      const storeItem = parse((await indexedDBService.getItem(key)) || '');
      expect(storeItem).toEqual({
        ...initialState,
        foo: 'baz',
      });
    });
  });

  describe('withStorageSync', () => {
    let warnings = [] as string[];

    vi.spyOn(console, 'warn').mockImplementation((...messages: string[]) => {
      warnings.push(...messages);
    });

    beforeEach(() => {
      warnings = [];
    });

    it('logs when writing happens before state is synchronized', async () => {
      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState({ name: 'Delta', age: 52 }),
        withStorageSync('flights', withIndexedDB()),
      );
      const store = TestBed.inject(Store);
      await waitForSyncStable(store);

      expect(warnings).toEqual([]);
    });

    it('warns when reading happens during a write', async () => {
      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState({ name: 'Delta', age: 52 }),
        withStorageSync('flights', withIndexedDB()),
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
        withStorageSync('flights', withIndexedDB()),
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
});
