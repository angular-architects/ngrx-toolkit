import { effect } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  getState,
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';
import { setResetState, withReset } from './with-reset';

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
