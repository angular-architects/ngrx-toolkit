import { TestBed } from '@angular/core/testing';
import { getState, patchState, signalStore, withState } from '@ngrx/signals';
import * as devMode from '../is-dev-mode';
import { withImmutableState } from '../with-immutable-state';

describe('withImmutableState', () => {
  const SECRET = Symbol('secret');

  const createInitialState = () => ({
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
  });

  const createStore = (enableInProduction: boolean | undefined) => {
    const initialState = createInitialState();
    const Store = signalStore(
      { protectedState: false },
      enableInProduction === undefined
        ? withImmutableState(initialState)
        : withImmutableState(initialState, { enableInProduction })
    );
    return TestBed.configureTestingModule({ providers: [Store] }).inject(Store);
  };

  for (const isDevMode of [true, false]) {
    describe(isDevMode ? 'dev mode' : 'production mode', () => {
      beforeEach(() => {
        jest.spyOn(devMode, 'isDevMode').mockReturnValue(isDevMode);
      });
      for (const { stateFactory, enableInProduction, name, protectionOn } of [
        {
          name: 'dev-only protection',
          stateFactory: () => createStore(false),
          enableInProduction: false,
          protectionOn: isDevMode,
        },
        {
          name: 'production protection',
          enableInProduction: true,
          stateFactory: () => createStore(true),
          protectionOn: true,
        },
        {
          name: 'default settings',
          enableInProduction: undefined,
          stateFactory: () => createStore(undefined),
          protectionOn: isDevMode,
        },
      ]) {
        describe(name, () => {
          it(`throws ${protectionOn ? '' : 'not '}on a mutable change`, () => {
            const state = stateFactory();

            const patch = () =>
              patchState(state, (state) => {
                state.ngrx = 'mutable change';
                return state;
              });

            if (protectionOn) {
              expect(patch).toThrowError(
                "Cannot assign to read only property 'ngrx' of object"
              );
            } else {
              expect(patch).not.toThrowError();
            }
          });

          it(`throws ${
            protectionOn ? '' : 'not '
          }on a nested mutable change`, () => {
            const state = stateFactory();

            const patch = () =>
              patchState(state, (state) => {
                state.user.firstName = 'mutable change';
                return state;
              });

            if (protectionOn) {
              expect(patch).toThrowError(
                "Cannot assign to read only property 'firstName' of object"
              );
            } else {
              expect(patch).not.toThrowError();
            }
          });

          describe('mutable changes outside of patchState', () => {
            it(`throws${
              protectionOn ? '' : ' not'
            } on reassigned a property of the exposed state`, () => {
              const state = stateFactory();
              const patch = () => {
                state.user().firstName = 'mutable change 1';
              };
              if (protectionOn) {
                expect(patch).toThrowError(
                  "Cannot assign to read only property 'firstName' of object"
                );
              } else {
                expect(patch).not.toThrowError();
              }
            });

            it(`throws ${
              protectionOn ? '' : 'not '
            }when exposed state via getState is mutated`, () => {
              const state = stateFactory();
              const s = getState(state);

              const patch = () => (s.ngrx = 'mutable change 2');

              if (protectionOn) {
                expect(patch).toThrowError(
                  "Cannot assign to read only property 'ngrx' of object"
                );
              } else {
                expect(patch).not.toThrowError();
              }
            });

            it(`throws ${
              protectionOn ? '' : 'not '
            }when mutable change happens`, () => {
              const state = stateFactory();
              const s = { user: { firstName: 'M', lastName: 'S' } };
              patchState(state, s);
              const patch = () => {
                s.user.firstName = 'mutable change 3';
              };
              if (protectionOn) {
                expect(patch).toThrowError(
                  "Cannot assign to read only property 'firstName' of object"
                );
              } else {
                expect(patch).not.toThrowError();
              }
            });

            it(`throws ${
              protectionOn ? '' : 'not '
            }when mutable change of root symbol property happens`, () => {
              const state = stateFactory();
              const s = getState(state);

              const patch = () => {
                s[SECRET].code = 'mutable change';
              };

              if (protectionOn) {
                expect(patch).toThrowError(
                  "Cannot assign to read only property 'code' of object"
                );
              } else {
                expect(patch).not.toThrowError();
              }
            });

            it(`throws ${
              protectionOn ? '' : 'not '
            }when mutable change of nested symbol property happens`, () => {
              const state = stateFactory();
              const s = getState(state);

              const patch = () => {
                s.nestedSymbol[SECRET] = 'mutable change';
              };

              if (protectionOn) {
                expect(patch).toThrowError(
                  "Cannot assign to read only property 'Symbol(secret)' of object"
                );
              } else {
                expect(patch).not.toThrowError();
              }
            });
          });

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
              it(`throws ${
                protectionOn ? '' : 'not '
              }on concatenated state (${name})`, () => {
                const UserStore = signalStore(
                  { providedIn: 'root' },
                  withImmutableState(createInitialState(), {
                    enableInProduction,
                  }),
                  withImmutableState(
                    { location: { city: 'London' } },
                    { enableInProduction }
                  )
                );
                const store = TestBed.inject(UserStore);
                const state = getState(store);

                if (protectionOn) {
                  expect(() => mutationFn(state)).toThrowError();
                } else {
                  expect(() => mutationFn(state)).not.toThrowError();
                }
              });
            }
          });

          it('should be possible to mix both mutable and immutable state', () => {
            const immutableState = {
              id: 1,
              name: 'John',
            };

            const mutableState = {
              address: 'London',
            };
            const TestStore = signalStore(
              { providedIn: 'root', protectedState: false },
              withImmutableState(immutableState, { enableInProduction }),
              withState(mutableState)
            );

            TestBed.inject(TestStore);

            if (protectionOn) {
              expect(() => (immutableState.name = 'Jane')).toThrow();
            } else {
              expect(() => (immutableState.name = 'Jane')).not.toThrow();
            }
            expect(
              () => (mutableState.address = 'Glastonbury')
            ).not.toThrowError();
          });
        });
      }
    });
  }
});
