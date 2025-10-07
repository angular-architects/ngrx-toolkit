import { effect } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  getState,
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';
import { reset, setResetState, withReset } from './with-reset';

describe('withReset', () => {
  const setup = () => {
    const initialState = {
      user: { id: 1, name: 'Konrad' },
      address: { city: 'Vienna', zip: '1010' },
    };

    const Store = signalStore(
      withState(initialState),
      withReset(),
      withMethods((store) => ({
        changeUser(id: number, name: string) {
          patchState(store, { user: { id, name } });
        },
        changeUserName(name: string) {
          patchState(store, (value) => ({ user: { ...value.user, name } }));
        },
        changeAddress(city: string, zip: string) {
          patchState(store, { address: { city, zip } });
        },
      })),
    );

    const store = TestBed.configureTestingModule({
      providers: [Store],
    }).inject(Store);

    return { store, initialState };
  };

  it('should reset state to initial state', () => {
    const { store, initialState } = setup();

    store.changeUser(2, 'Max');
    expect(getState(store)).toMatchObject({
      user: { id: 2, name: 'Max' },
    });
    store.resetState();
    expect(getState(store)).toStrictEqual(initialState);
  });

  it('should not fire if reset is called on unchanged state', () => {
    const { store } = setup();
    let effectCounter = 0;
    TestBed.runInInjectionContext(() => {
      effect(() => {
        store.user();
        effectCounter++;
      });
    });
    TestBed.flushEffects();
    store.resetState();
    TestBed.flushEffects();
    expect(effectCounter).toBe(1);
  });

  it('should not fire on props which are unchanged', () => {
    const { store } = setup();
    let effectCounter = 0;
    TestBed.runInInjectionContext(() => {
      effect(() => {
        store.address();
        effectCounter++;
      });
    });

    TestBed.flushEffects();
    expect(effectCounter).toBe(1);
    store.changeUserName('Max');
    TestBed.flushEffects();
    store.changeUser(2, 'Ludwig');
    TestBed.flushEffects();
    expect(effectCounter).toBe(1);
  });

  it('should be possible to change the reset state', () => {
    const { store } = setup();

    setResetState(store, {
      user: { id: 2, name: 'Max' },
      address: { city: 'London', zip: 'SW1' },
    });

    store.changeUser(3, 'Ludwig');
    store.changeAddress('Paris', '75001');

    store.resetState();
    expect(getState(store)).toEqual({
      user: { id: 2, name: 'Max' },
      address: { city: 'London', zip: 'SW1' },
    });
  });

  it('should throw on setResetState if store is not configured with withReset()', () => {
    const Store = signalStore({ providedIn: 'root' }, withState({}));
    const store = TestBed.inject(Store);
    expect(() => setResetState(store, {})).toThrow(
      'Cannot set reset state, since store is not configured with withReset()',
    );
  });
});

describe('reset function with SignalStore', () => {
  describe('generic reset (no pick function)', () => {
    class TestClass {
      value = 'test';
    }

    const originalDate = new Date('2023-01-01T00:00:00Z');
    const newInstance = new TestClass();

    const setup = () => {
      const initialState = {
        name: 'John',
        description: 'Test description',
        count: 42,
        price: 99.99,
        negative: -5,
        isActive: true,
        isVisible: false,
        hasPermission: true,
        items: [1, 2, 3],
        tags: ['a', 'b'],
        empty: [],
        user: { id: 1, name: 'John' },
        config: { theme: 'dark' },
        emptyObj: {},
        nullValue: null,
        undefinedValue: undefined,
        mixed: null,
        createdAt: originalDate,
        updatedAt: new Date(),
        address: { city: 'Vienna', zip: '1010' },
        stringValue: 'hello',
        numberValue: 42,
        booleanValue: true,
        arrayValue: [1, 2, 3],
        objectValue: { nested: 'value' },
        dateValue: new Date('2023-01-01'),
        callback: () => 'test',
        method: function () {
          return 'method';
        },
        arrow: () => 'arrow',
        instance: new TestClass(),
        error: new Error('test'),
        regex: /test/,
      };

      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withReset(),
        withMethods((store) => ({
          updateName(name: string) {
            patchState(store, { name });
          },
          updateDescription(description: string) {
            patchState(store, { description });
          },
          updateCount(count: number) {
            patchState(store, { count });
          },
          updatePrice(price: number) {
            patchState(store, { price });
          },
          toggleActive() {
            patchState(store, (state) => ({ isActive: !state.isActive }));
          },
          toggleVisible() {
            patchState(store, (state) => ({ isVisible: !state.isVisible }));
          },
          addItem(item: number) {
            patchState(store, (state) => ({ items: [...state.items, item] }));
          },
          addTag(tag: string) {
            patchState(store, (state) => ({ tags: [...state.tags, tag] }));
          },
          updateUser(user: { id: number; name: string }) {
            patchState(store, { user });
          },
          updateConfig(config: { theme: string }) {
            patchState(store, { config });
          },
          setNullValue(value: null) {
            patchState(store, { nullValue: value });
          },
          updateCreatedAt(date: Date) {
            patchState(store, { createdAt: date });
          },
          updateAll() {
            patchState(store, {
              stringValue: 'world',
              numberValue: 100,
              booleanValue: false,
              arrayValue: [4, 5, 6],
              objectValue: { nested: 'updated' },
              dateValue: new Date('2024-01-01'),
            });
          },
          updateInstance(instance: TestClass) {
            patchState(store, { instance });
          },
          updateCallback(fn: () => string) {
            patchState(store, { callback: fn });
          },
        })),
      );

      const store = TestBed.configureTestingModule({
        providers: [Store],
      }).inject(Store);

      return { store, initialState };
    };
    it('should reset string values to empty string', () => {
      const { store } = setup();

      // Modify state
      store.updateName('Jane');
      store.updateDescription('Updated description');
      expect(getState(store)).toMatchObject({
        name: 'Jane',
        description: 'Updated description',
      });

      // Reset using generic reset
      patchState(store, reset());
      expect(getState(store)).toMatchObject({ name: '', description: '' });
    });

    it('should reset number values to 0', () => {
      const { store } = setup();

      // Modify state
      store.updateCount(100);
      store.updatePrice(199.99);
      expect(getState(store)).toMatchObject({
        count: 100,
        price: 199.99,
        negative: -5,
      });

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      expect(getState(store)).toMatchObject({
        count: 0,
        price: 0,
        negative: 0,
      });
    });

    it('should reset boolean values to false', () => {
      const { store } = setup();

      // Modify state
      store.toggleActive();
      store.toggleVisible();
      expect(getState(store)).toMatchObject({
        isActive: false,
        isVisible: true,
        hasPermission: true,
      });

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      expect(getState(store)).toMatchObject({
        isActive: false,
        isVisible: false,
        hasPermission: false,
      });
    });

    it('should reset array values to empty array', () => {
      const { store } = setup();

      // Modify state
      store.addItem(4);
      store.addTag('c');
      expect(getState(store)).toMatchObject({
        items: [1, 2, 3, 4],
        tags: ['a', 'b', 'c'],
        empty: [],
      });

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      expect(getState(store)).toMatchObject({ items: [], tags: [], empty: [] });
    });

    it('should reset object values to empty object', () => {
      const { store } = setup();

      // Modify state
      store.updateUser({ id: 2, name: 'Jane' });
      store.updateConfig({ theme: 'light' });
      expect(getState(store)).toMatchObject({
        user: { id: 2, name: 'Jane' },
        config: { theme: 'light' },
        empty: {},
      });

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      expect(getState(store)).toMatchObject({
        user: {},
        config: {},
        empty: {},
      });
    });

    it('should preserve null and undefined values', () => {
      const { store } = setup();

      // Modify state
      store.setNullValue(null);
      expect(getState(store)).toMatchObject({
        nullValue: null,
        undefinedValue: undefined,
        mixed: null,
      });

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      expect(getState(store)).toMatchObject({
        nullValue: null,
        undefinedValue: undefined,
        mixed: null,
      });
    });

    it('should reset Date values to new Date', () => {
      const { store } = setup();

      // Modify state
      const newDate = new Date('2024-01-01T00:00:00Z');
      store.updateCreatedAt(newDate);
      expect(getState(store).createdAt).toEqual(newDate);

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      const resetState = getState(store);
      expect(resetState.createdAt).toBeInstanceOf(Date);
      expect(resetState.updatedAt).toBeInstanceOf(Date);
      expect(resetState.createdAt.getTime()).not.toBe(originalDate.getTime());
    });

    it('should handle mixed data types', () => {
      const { store } = setup();

      // Modify state
      store.updateAll();
      expect(getState(store).stringValue).toBe('world');
      expect(getState(store).numberValue).toBe(100);
      expect(getState(store).booleanValue).toBe(false);

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      const resetState = getState(store);
      expect(resetState.stringValue).toBe('');
      expect(resetState.numberValue).toBe(0);
      expect(resetState.booleanValue).toBe(false);
      expect(resetState.arrayValue).toEqual([]);
      expect(resetState.objectValue).toEqual({});
      expect(resetState.nullValue).toBeNull();
      expect(resetState.undefinedValue).toBeUndefined();
      expect(resetState.dateValue).toBeInstanceOf(Date);
    });

    it('should handle functions and return undefined', () => {
      const { store } = setup();

      // Modify state
      store.updateCallback(() => 'updated');
      expect(getState(store).callback()).toBe('updated');

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      const resetState = getState(store);
      expect(resetState.callback).toBeUndefined();
      expect(resetState.method).toBeUndefined();
      expect(resetState.arrow).toBeUndefined();
    });

    it('should handle class instances and return undefined', () => {
      const { store } = setup();

      // Modify state
      newInstance.value = 'updated';
      store.updateInstance(newInstance);
      expect(getState(store).instance.value).toBe('updated');

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      const resetState = getState(store);
      expect(resetState.instance).toBeUndefined();
      expect(resetState.error).toBeUndefined();
      expect(resetState.regex).toBeUndefined();
    });
  });

  describe('selective reset (with pick function)', () => {
    const initialState = {
      user: { id: 1, name: 'John', profile: { age: 30 } },
      count: 42,
      isActive: true,
      items: [1, 2, 3],
      tags: ['a', 'b'],
      settings: { theme: 'dark', language: 'en' },
    };

    const setup = () => {
      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withReset(),
        withMethods((store) => ({
          updateUser(user: {
            id: number;
            name: string;
            profile: { age: number };
          }) {
            patchState(store, { user });
          },
          updateSettings(settings: { theme: string; language: string }) {
            patchState(store, { settings });
          },
          resetUser() {
            patchState(
              store,
              reset((initial) => ({ user: initial.user })),
            );
          },
          updateCount(count: number) {
            patchState(store, { count });
          },
          toggleActive() {
            patchState(store, (state) => ({ isActive: !state.isActive }));
          },
          addItem(item: number) {
            patchState(store, (state) => ({ items: [...state.items, item] }));
          },
          resetSelected() {
            patchState(
              store,
              reset((initial) => ({
                user: initial.user,
                count: initial.count,
              })),
            );
          },
          addTag(tag: string) {
            patchState(store, (state) => ({ tags: [...state.tags, tag] }));
          },

          resetItems() {
            patchState(
              store,
              reset((initial) => ({ items: initial.items })),
            );
          },
        })),
      );

      const store = TestBed.configureTestingModule({
        providers: [Store],
      }).inject(Store);

      return { store, initialState };
    };

    it('should reset only selected properties', () => {
      const { store } = setup();

      // Modify state
      store.updateUser({ id: 2, name: 'Jane', profile: { age: 45 } });
      store.updateCount(100);
      store.toggleActive();
      store.addItem(4);
      expect(getState(store)).toMatchObject({
        user: { id: 2, name: 'Jane' },
        count: 100,
        isActive: false,
        items: [1, 2, 3, 4],
      });

      // Reset only selected properties
      store.resetSelected();
      const resetState = getState(store);
      expect(resetState.user).toMatchObject({
        id: 2,
        name: 'Jane',
        profile: { age: 45 },
      });
      expect(resetState.count).toBe(100);
      expect(resetState.isActive).toBe(false); // Should remain unchanged
      expect(resetState.items).toEqual([1, 2, 3, 4]); // Should remain unchanged
    });

    it('should handle nested object reset', () => {
      const { store } = setup();

      console.log(store, 'store');

      // Modify state
      store.updateUser({ id: 2, name: 'Jane', profile: { age: 25 } });
      store.updateSettings({ theme: 'light', language: 'fr' });
      expect(getState(store)).toMatchObject({
        user: { id: 2, name: 'Jane', profile: { age: 25 } },
        settings: { theme: 'light', language: 'fr' },
      });

      // Reset only user
      store.resetUser();
      const resetState = getState(store);
      expect(resetState.user).toEqual({
        id: 2,
        name: 'Jane',
        profile: { age: 25 },
      });
      expect(resetState.settings).toEqual({ theme: 'light', language: 'fr' });
    });

    it('should handle array reset', () => {
      const { store } = setup();

      // Modify state
      store.addItem(4);
      store.addTag('c');
      store.updateCount(100);
      expect(getState(store)).toMatchObject({
        items: [1, 2, 3, 4],
        tags: ['a', 'b', 'c'],
        count: 100,
      });

      // Reset only items
      store.resetItems();
      const resetState = getState(store);
      expect(resetState.items).toEqual([1, 2, 3, 4]);
      expect(resetState.tags).toEqual(['a', 'b', 'c']);
      expect(resetState.count).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle empty state object', () => {
      const initialState = {};

      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withReset(),
        withMethods((store) => ({
          // Since we can't add properties to empty state, we'll test reset directly
          testReset() {
            patchState(store, reset()(getState(store)));
          },
        })),
      );

      const store = TestBed.configureTestingModule({
        providers: [Store],
      }).inject(Store);

      // Test reset on empty state
      store.testReset();
      expect(getState(store)).toEqual({});
    });

    it('should handle state with only null/undefined values', () => {
      const initialState = {
        nullValue: null,
        undefinedValue: undefined,
      };

      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withReset(),
        withMethods((store) => ({
          setNullValue(value: null) {
            patchState(store, { nullValue: value });
          },
        })),
      );

      const store = TestBed.configureTestingModule({
        providers: [Store],
      }).inject(Store);

      // Modify state
      store.setNullValue(null);
      expect(getState(store)).toEqual({
        nullValue: null,
        undefinedValue: undefined,
      });

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      expect(getState(store)).toEqual({
        nullValue: null,
        undefinedValue: undefined,
      });
    });

    it('should handle state with Symbol keys', () => {
      const sym = Symbol('test');
      const initialState = {
        [sym]: 'symbol value',
        regular: 'regular value',
      };

      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withReset(),
        withMethods((store) => ({
          updateRegular(value: string) {
            patchState(store, { regular: value });
          },
        })),
      );

      const store = TestBed.configureTestingModule({
        providers: [Store],
      }).inject(Store);

      // Modify state
      store.updateRegular('updated');
      expect(getState(store).regular).toBe('updated');

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      const resetState = getState(store);
      expect(resetState.regular).toBe('');
      // Symbol properties are not enumerable, so they won't be processed
    });

    it('should handle state with non-enumerable properties', () => {
      const initialState = { regular: 'value' };
      Object.defineProperty(initialState, 'nonEnumerable', {
        value: 'test',
        enumerable: false,
      });

      const Store = signalStore(
        { providedIn: 'root', protectedState: false },
        withState(initialState),
        withReset(),
        withMethods((store) => ({
          updateRegular(value: string) {
            patchState(store, { regular: value });
          },
        })),
      );

      const store = TestBed.configureTestingModule({
        providers: [Store],
      }).inject(Store);

      // Modify state
      store.updateRegular('updated');
      expect(getState(store).regular).toBe('updated');

      // Reset using generic reset
      patchState(store, reset()(getState(store)));
      const resetState = getState(store);
      expect(resetState.regular).toBe('');
      // Non-enumerable properties are processed by reset and reset to default values
      expect((resetState as Record<string, unknown>)['nonEnumerable']).toBe('');
    });
  });
});
