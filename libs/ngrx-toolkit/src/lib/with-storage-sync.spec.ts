import { getState, patchState, signalStore, withState } from '@ngrx/signals';
import { withStorageSync } from './with-storage-sync';
import { TestBed } from '@angular/core/testing';
import * as flushPromises from 'flush-promises';
import { IndexedDBService } from './storage-sync/internal/indexeddb.service';

interface StateObject {
  foo: string;
  age: number;
}

const initialState: StateObject = {
  foo: 'bar',
  age: 18,
};
const key = 'FooBar';

describe('withStorageSync', () => {
  let indexedDBService: IndexedDBService;
  beforeEach(() => {
    // make sure to start with a clean storage
    localStorage.removeItem(key);

    indexedDBService = TestBed.inject(IndexedDBService);
  });

  it('adds methods for storage access to the store', async () => {
    await TestBed.runInInjectionContext(async () => {
      const Store = signalStore(withStorageSync({ key }));
      const store = new Store();

      await flushPromises();

      expect(Object.keys(store)).toEqual([
        'clearStorage',
        'readFromStorage',
        'writeToStorage',
      ]);
    });
  });

  it('offers manual sync using provided methods', async () => {
    await TestBed.runInInjectionContext(async () => {
      // prefill storage
      localStorage.setItem(
        key,
        JSON.stringify({
          foo: 'baz',
          age: 99,
        } as StateObject)
      );

      const Store = signalStore(
        { protectedState: false },
        withStorageSync({ key, autoSync: false })
      );
      const store = new Store();

      await flushPromises();

      expect(getState(store)).toEqual({});

      await store.readFromStorage();
      expect(getState(store)).toEqual({
        foo: 'baz',
        age: 99,
      });

      patchState(store, { ...initialState });
      TestBed.flushEffects();

      let storeItem = JSON.parse(localStorage.getItem(key) || '{}');
      expect(storeItem).toEqual({
        foo: 'baz',
        age: 99,
      });

      await store.writeToStorage();
      storeItem = JSON.parse(localStorage.getItem(key) || '{}');
      expect(storeItem).toEqual({
        ...initialState,
      });

      await store.clearStorage();
      storeItem = localStorage.getItem(key);
      expect(storeItem).toEqual(null);
    });
  });

  describe('autoSync', () => {
    it('inits from storage and write to storage on changes when set to `true`', async () => {
      await TestBed.runInInjectionContext(async () => {
        // prefill storage
        localStorage.setItem(
          key,
          JSON.stringify({
            foo: 'baz',
            age: 99,
          } as StateObject)
        );

        const Store = signalStore(
          { protectedState: false },
          withStorageSync(key)
        );
        const store = new Store();
        await flushPromises();

        expect(getState(store)).toEqual({
          foo: 'baz',
          age: 99,
        });

        patchState(store, { ...initialState });
        TestBed.flushEffects();

        expect(getState(store)).toEqual({
          ...initialState,
        });
        const storeItem = JSON.parse(localStorage.getItem(key) || '{}');
        expect(storeItem).toEqual({
          ...initialState,
        });
      });
    });

    it('does not init from storage and does write to storage on changes when set to `false`', async () => {
      await TestBed.runInInjectionContext(async () => {
        // prefill storage
        localStorage.setItem(
          key,
          JSON.stringify({
            foo: 'baz',
            age: 99,
          } as StateObject)
        );

        const Store = signalStore(
          { protectedState: false },
          withStorageSync({ key, autoSync: false })
        );
        const store = new Store();

        await flushPromises();

        expect(getState(store)).toEqual({});

        patchState(store, { ...initialState });
        const storeItem = JSON.parse(localStorage.getItem(key) || '{}');
        expect(storeItem).toEqual({
          foo: 'baz',
          age: 99,
        });
      });
    });
  });

  describe('select', () => {
    it('syncs the whole state by default', async () => {
      await TestBed.runInInjectionContext(async () => {
        const Store = signalStore(
          { protectedState: false },
          withStorageSync(key)
        );
        const store = new Store();

        await flushPromises();

        patchState(store, { ...initialState });

        TestBed.flushEffects();

        const storeItem = JSON.parse(localStorage.getItem(key) || '{}');
        expect(storeItem).toEqual({
          ...initialState,
        });
      });
    });

    it('syncs selected slices when specified', async () => {
      await TestBed.runInInjectionContext(async () => {
        const Store = signalStore(
          { protectedState: false },
          withState(initialState),
          withStorageSync({ key, select: ({ foo }) => ({ foo }) })
        );
        const store = new Store();

        await flushPromises();

        patchState(store, { foo: 'baz' });
        TestBed.flushEffects();

        const storeItem = JSON.parse(localStorage.getItem(key) || '{}');
        expect(storeItem).toEqual({
          foo: 'baz',
        });
      });
    });
  });

  describe('parse/stringify', () => {
    it('uses custom parsing/stringification when specified', async () => {
      const parse = (stateString: string) => {
        const [foo, age] = stateString.split('_');
        return {
          foo,
          age: +age,
        };
      };

      await TestBed.runInInjectionContext(async () => {
        const Store = signalStore(
          { protectedState: false },
          withState(initialState),
          withStorageSync({
            key,
            parse,
            stringify: (state) => `${state.foo}_${state.age}`,
          })
        );
        const store = new Store();

        await flushPromises();

        patchState(store, { foo: 'baz' });
        TestBed.flushEffects();

        const storeItem = parse(localStorage.getItem(key) || '');

        expect(storeItem).toEqual({
          ...initialState,
          foo: 'baz',
        });
      });
    });
  });

  describe('storage', () => {
    it('uses specified storage', async () => {
      await TestBed.runInInjectionContext(async () => {
        // prefill storage
        sessionStorage.setItem(
          key,
          JSON.stringify({
            foo: 'baz',
            age: 99,
          } as StateObject)
        );

        const Store = signalStore(
          { protectedState: false },
          withStorageSync({ key, storageType: 'sessionStorage' })
        );

        const store = new Store();

        await flushPromises();

        expect(getState(store)).toEqual({
          foo: 'baz',
          age: 99,
        });

        patchState(store, { ...initialState });
        TestBed.flushEffects();

        expect(getState(store)).toEqual({
          ...initialState,
        });
        const storeItem = JSON.parse(sessionStorage.getItem(key) || '{}');
        expect(storeItem).toEqual({
          ...initialState,
        });

        await store.clearStorage();
      });
    });
  });

  describe('indexedDB', () => {
    it('uses indexedDB', async () => {
      const dbName = 'ngrx-toolkit';
      const storeName = 'FooBar';

      // set items
      await indexedDBService.write(
        dbName,
        storeName,
        JSON.stringify({
          foo: 'baz',
          age: 99,
        } as StateObject)
      );

      await TestBed.runInInjectionContext(async () => {
        const Store = signalStore(
          { protectedState: false },
          withStorageSync({
            storageType: 'indexedDB',
            dbName,
            storeName,
          })
        );

        const store = new Store();

        // asynchronous in effect
        await flushPromises();

        // await storageService.getItem function
        await flushPromises();

        expect(getState(store)).toEqual({
          foo: 'baz',
          age: 99,
        });
      });
    });
  });
});
