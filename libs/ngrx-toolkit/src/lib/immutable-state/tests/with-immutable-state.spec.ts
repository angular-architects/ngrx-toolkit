import { TestBed } from '@angular/core/testing';
import { withImmutableState } from '../with-immutable-state';
import { getState, patchState, signalStore } from '@ngrx/signals';

describe.skip('withImmutableState', () => {
  const SECRET = Symbol('secret');

  const initialState = {
    user: {
      firstName: 'John',
      lastName: 'Smith',
    },
    foo: 'bar',
    numbers: [1, 2, 3],
    ngrx: 'signals',
    nestedSymbol: {
      [SECRET]: 'another secret',
    },
    [SECRET]: {
      code: 'secret',
      value: '123',
    },
  };

  const createStore = (disableProtectionInProd: boolean) => {
    const Store = signalStore(
      { protectedState: false },
      withImmutableState(initialState, { disableProtectionInProd })
    );
    return TestBed.configureTestingModule({ providers: [Store] }).inject(Store);
  };

  for (const { stateFactory, name } of [
    {
      name: 'dev-only protection',
      stateFactory: () => createStore(true),
    },
    {
      name: 'production protection',
      stateFactory: () => createStore(false),
    },
  ]) {
    describe(name, () => {
      it(`throws on a mutable change`, () => {
        const state = stateFactory();
        expect(() =>
          patchState(state, (state) => {
            state.ngrx = 'mutable change';
            return state;
          })
        ).toThrowError("Cannot assign to read only property 'ngrx' of object");
      });

      it('throws on a nested mutable change', () => {
        const state = stateFactory();
        expect(() =>
          patchState(state, (state) => {
            state.user.firstName = 'mutable change';
            return state;
          })
        ).toThrowError(
          "Cannot assign to read only property 'firstName' of object"
        );
      });

      describe('mutable changes outside of patchState', () => {
        it('throws on reassigned a property of the exposed state', () => {
          const state = stateFactory();
          expect(() => {
            state.user().firstName = 'mutable change 1';
          }).toThrowError(
            "Cannot assign to read only property 'firstName' of object"
          );
        });

        it('throws when exposed state via getState is mutated', () => {
          const state = stateFactory();
          const s = getState(state);

          expect(() => (s.ngrx = 'mutable change 2')).toThrowError(
            "Cannot assign to read only property 'ngrx' of object"
          );
        });

        it('throws when mutable change happens', () => {
          const state = stateFactory();
          const s = { user: { firstName: 'M', lastName: 'S' } };
          patchState(state, s);

          expect(() => {
            s.user.firstName = 'mutable change 3';
          }).toThrowError(
            "Cannot assign to read only property 'firstName' of object"
          );
        });

        it('throws when mutable change of root symbol property happens', () => {
          const state = stateFactory();
          const s = getState(state);

          expect(() => {
            s[SECRET].code = 'mutable change';
          }).toThrowError(
            "Cannot assign to read only property 'code' of object"
          );
        });

        it('throws when mutable change of nested symbol property happens', () => {
          const state = stateFactory();
          const s = getState(state);

          expect(() => {
            s.nestedSymbol[SECRET] = 'mutable change';
          }).toThrowError(
            "Cannot assign to read only property 'Symbol(secret)' of object"
          );
        });
      });
    });
  }

  describe('special tests', () => {
    for (const { name, mutationFn } of [
      {
        name: 'location',
        mutationFn: (state: { location: { city: string } }) =>
          (state.location.city = 'Paris'),
      },
      {
        name: 'user',
        mutationFn: (state: { user: { firstName: string } }) =>
          (state.user.firstName = 'Jane'),
      },
    ]) {
      it(`throws on concatenated state (${name})`, () => {
        const UserStore = signalStore(
          { providedIn: 'root' },
          withImmutableState(initialState),
          withImmutableState({ location: { city: 'London' } })
        );
        const store = TestBed.inject(UserStore);
        const state = getState(store);

        expect(() => mutationFn(state)).toThrowError();
      });
    }
  });
});
