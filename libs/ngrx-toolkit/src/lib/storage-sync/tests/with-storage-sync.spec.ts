import { TestBed } from '@angular/core/testing';
import { getState, patchState, signalStore, withState } from '@ngrx/signals';
import { withLocalStorage } from '../features/with-local-storage';
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

describe('withStorageSync (sync storage)', () => {
  beforeEach(() => {
    // make sure to start with a clean storage
    localStorage.removeItem(key);
  });

  it('adds methods for storage access to the store', () => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(withStorageSync({ key }));
      const store = new Store();

      expect(Object.keys(store)).toEqual([
        'clearStorage',
        'readFromStorage',
        'writeToStorage',
      ]);
    });
  });

  it('offers manual sync using provided methods', () => {
    TestBed.runInInjectionContext(() => {
      // prefill storage
      localStorage.setItem(
        key,
        JSON.stringify({
          foo: 'baz',
          age: 99,
        } as StateObject),
      );

      const Store = signalStore(
        { protectedState: false },
        withStorageSync({ key, autoSync: false }),
      );
      const store = new Store();
      expect(getState(store)).toEqual({});

      store.readFromStorage();
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

      store.writeToStorage();
      storeItem = JSON.parse(localStorage.getItem(key) || '{}');
      expect(storeItem).toEqual({
        ...initialState,
      });

      store.clearStorage();
      storeItem = localStorage.getItem(key);
      expect(storeItem).toEqual(null);
    });
  });

  describe('autoSync', () => {
    it('inits from storage and write to storage on changes when set to `true`', () => {
      TestBed.runInInjectionContext(() => {
        // prefill storage
        localStorage.setItem(
          key,
          JSON.stringify({
            foo: 'baz',
            age: 99,
          } as StateObject),
        );

        const Store = signalStore(
          { protectedState: false },
          withStorageSync(key),
        );
        const store = new Store();
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

    it('does not init from storage and does write to storage on changes when set to `false`', () => {
      TestBed.runInInjectionContext(() => {
        // prefill storage
        localStorage.setItem(
          key,
          JSON.stringify({
            foo: 'baz',
            age: 99,
          } as StateObject),
        );

        const Store = signalStore(
          { protectedState: false },
          withStorageSync({ key, autoSync: false }),
        );
        const store = new Store();
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
    it('syncs the whole state by default', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(
          { protectedState: false },
          withStorageSync(key),
        );
        const store = new Store();

        patchState(store, { ...initialState });
        TestBed.flushEffects();

        const storeItem = JSON.parse(localStorage.getItem(key) || '{}');
        expect(storeItem).toEqual({
          ...initialState,
        });
      });
    });

    it('syncs selected slices when specified', () => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(
          { protectedState: false },
          withState(initialState),
          withStorageSync({ key, select: ({ foo }) => ({ foo }) }),
        );
        const store = new Store();

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
    it('uses custom parsing/stringification when specified', () => {
      const parse = (stateString: string) => {
        const [foo, age] = stateString.split('_');
        return {
          foo,
          age: +age,
        };
      };

      TestBed.runInInjectionContext(() => {
        const Store = signalStore(
          { protectedState: false },
          withState(initialState),
          withStorageSync({
            key,
            parse,
            stringify: (state) => `${state.foo}_${state.age}`,
          }),
        );
        const store = new Store();

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

  describe('storage factory', () => {
    it('should throw an error when both config and storage strategy are provided', () => {
      const signalStoreFactory = () =>
        signalStore(
          withStorageSync(
            { key: 'foo', storage: () => localStorage },
            withLocalStorage(),
          ),
        );

      expect(signalStoreFactory).toThrow(
        'You can either pass a storage strategy or a config with storage, but not both.',
      );
    });

    it('uses specified storage', () => {
      TestBed.runInInjectionContext(() => {
        // prefill storage
        sessionStorage.setItem(
          key,
          JSON.stringify({
            foo: 'baz',
            age: 99,
          } as StateObject),
        );

        const Store = signalStore(
          { protectedState: false },
          withStorageSync({ key, storage: () => sessionStorage }),
        );
        const store = new Store();
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

        store.clearStorage();
      });
    });
  });
});
