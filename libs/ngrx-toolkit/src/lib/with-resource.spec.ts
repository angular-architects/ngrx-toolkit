import { httpResource, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { inject, Injectable, Resource, resource, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import {
  patchState,
  signalStore,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { of } from 'rxjs';
import { mapToResource, withResource } from './with-resource';

describe('withResource', () => {
  describe('standard tests', () => {
    const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

    type Address = {
      street: string;
      city: {
        zip: string;
        name: string;
      };
      country: string;
    };

    const venice: Address = {
      street: 'Sestiere Dorsoduro, 2771',
      city: {
        zip: '30123',
        name: 'Venezia VE',
      },
      country: 'Italy',
    };

    @Injectable({ providedIn: 'root' })
    class AddressResolver {
      resolve(id: number) {
        void id;
        return Promise.resolve<Address>(venice);
      }
    }

    function setupWithUnnamedResource() {
      const addressResolver = {
        resolve: jest.fn(() => Promise.resolve(venice)),
      };
      const AddressStore = signalStore(
        { providedIn: 'root', protectedState: false },
        withState({ id: undefined as number | undefined }),
        withResource((store) => {
          const resolver = inject(AddressResolver);
          return resource({
            params: store.id,
            loader: ({ params: id }) => resolver.resolve(id),
          });
        }),
        withMethods((store) => ({ reload: () => store._reload() })),
      );

      TestBed.configureTestingModule({
        providers: [
          {
            provide: AddressResolver,
            useValue: addressResolver,
          },
        ],
      });

      const store = TestBed.inject(AddressStore);

      return { store, addressResolver };
    }

    function setupWithNamedResource() {
      const addressResolver = {
        resolve: jest.fn(() => Promise.resolve(venice)),
      };

      const UserStore = signalStore(
        { providedIn: 'root', protectedState: false },
        withState({ id: undefined as number | undefined }),
        withResource((store) => {
          const resolver = inject(AddressResolver);
          return {
            address: resource({
              params: store.id,
              loader: ({ params: id }) => resolver.resolve(id),
            }),
          };
        }),
        withMethods((store) => ({ reload: () => store._addressReload() })),
      );

      TestBed.configureTestingModule({
        providers: [
          {
            provide: AddressResolver,
            useValue: addressResolver,
          },
        ],
      });

      const store = TestBed.inject(UserStore);

      return { store, addressResolver };
    }

    describe('withResource', () => {
      describe('InnerSignalStore access', () => {
        it('can access the state signals', async () => {
          const UserStore = signalStore(
            { providedIn: 'root' },
            withState({ userId: 1 }),
            withResource((store) =>
              resource({
                params: store.userId,
                loader: ({ params: id }) => Promise.resolve(id + 1),
              }),
            ),
          );

          const userStore = TestBed.inject(UserStore);

          await wait();
          expect(userStore.value()).toBe(2);
        });

        it('can accept an rxResource', async () => {
          const UserStore = signalStore(
            { providedIn: 'root' },
            withState({ userId: 1 }),
            withResource((store) =>
              rxResource({
                params: store.userId,
                stream: ({ params: id }) => of(id + 1),
              }),
            ),
          );

          const userStore = TestBed.inject(UserStore);

          await wait();
          expect(userStore.value()).toBe(2);
        });

        it('can access the props', async () => {
          const UserStore = signalStore(
            { providedIn: 'root' },
            withProps(() => ({ userId: 1 })),
            withResource((store) =>
              resource({
                params: () => store.userId,
                loader: ({ params: id }) => Promise.resolve(id + 1),
              }),
            ),
          );

          const userStore = TestBed.inject(UserStore);
          await wait();
          expect(userStore.value()).toBe(2);
        });

        it('can access the methods', async () => {
          const UserStore = signalStore(
            { providedIn: 'root' },
            withMethods(() => ({ getValue: () => 1 })),
            withResource((store) =>
              resource({
                params: () => store.getValue(),
                loader: ({ params: id }) => Promise.resolve(id + 1),
              }),
            ),
          );

          const userStore = TestBed.inject(UserStore);
          await wait();
          expect(userStore.value()).toBe(2);
        });
      });

      describe('status checks', () => {
        for (const { name, setup } of [
          {
            name: 'unnamed resource',
            setup: () => {
              const { store, addressResolver } = setupWithUnnamedResource();
              const setId = (id: number) => patchState(store, { id });
              const setValue = (value: Address) => patchState(store, { value });
              return {
                storeAndResource: store,
                addressResolver,
                setId,
                setValue,
              };
            },
          },
          {
            name: 'mapped named resource',
            setup: () => {
              const { store, addressResolver } = setupWithNamedResource();
              const storeAndResource = mapToResource(store, 'address');
              const setId = (id: number) => patchState(store, { id });
              const setValue = (value: Address) =>
                patchState(store, { addressValue: value });
              return { storeAndResource, addressResolver, setId, setValue };
            },
          },
        ]) {
          describe(name, () => {
            it('has idle status in the beginning', () => {
              const { storeAndResource } = setup();

              expect(storeAndResource.status()).toBe('idle');
              expect(storeAndResource.value()).toBeUndefined();
              expect(storeAndResource.error()).toBeUndefined();
              expect(storeAndResource.isLoading()).toBe(false);
              expect(storeAndResource.hasValue()).toBe(false);
            });

            it('has loading status when loading', () => {
              const { storeAndResource, addressResolver, setId } = setup();

              addressResolver.resolve.mockResolvedValue(venice);
              setId(1);

              expect(storeAndResource.status()).toBe('loading');
              expect(storeAndResource.value()).toBeUndefined();
              expect(storeAndResource.error()).toBeUndefined();
              expect(storeAndResource.isLoading()).toBe(true);
              expect(storeAndResource.hasValue()).toBe(false);
            });

            it('has resolved status when loaded', async () => {
              const { storeAndResource, addressResolver, setId } = setup();

              addressResolver.resolve.mockResolvedValue(venice);
              setId(1);

              await wait();

              expect(storeAndResource.status()).toBe('resolved');
              expect(storeAndResource.value()).toEqual(venice);
              expect(storeAndResource.error()).toBeUndefined();
              expect(storeAndResource.isLoading()).toBe(false);
              expect(storeAndResource.hasValue()).toBe(true);
            });

            it('has error status when error', async () => {
              const { storeAndResource, addressResolver, setId } = setup();

              addressResolver.resolve.mockRejectedValue(new Error('Error'));
              setId(1);
              await wait();

              expect(storeAndResource.status()).toBe('error');
              expect(() => storeAndResource.value()).toThrow();
              expect(storeAndResource.error()).toBeInstanceOf(Error);
              expect(storeAndResource.isLoading()).toBe(false);
              expect(storeAndResource.hasValue()).toBe(false);
            });

            it('has local once updated', async () => {
              const { storeAndResource, addressResolver, setId, setValue } =
                setup();

              addressResolver.resolve.mockResolvedValue(venice);
              setId(1);

              await wait();
              setValue({ ...venice, country: 'Italia' });

              expect(storeAndResource.status()).toBe('local');
              expect(storeAndResource.value()?.country).toBe('Italia');
              expect(storeAndResource.error()).toBeUndefined();
              expect(storeAndResource.isLoading()).toBe(false);
              expect(storeAndResource.hasValue()).toBe(true);
            });
          });
        }

        it('reloads an unnamed resource', async () => {
          const { store, addressResolver } = setupWithUnnamedResource();

          addressResolver.resolve.mockResolvedValue(venice);
          patchState(store, { id: 1 });

          await wait();
          expect(store.hasValue()).toBe(true);

          addressResolver.resolve.mockResolvedValue({
            ...venice,
            country: 'Great Britain',
          });
          store.reload();

          await wait();
          expect(store.value()?.country).toBe('Great Britain');
        });

        describe('named resource', () => {
          it('has idle status in the beginning', () => {
            const { store } = setupWithNamedResource();

            expect(store.addressStatus()).toBe('idle');
            expect(store.addressValue()).toBeUndefined();
            expect(store.addressError()).toBeUndefined();
            expect(store.addressIsLoading()).toBe(false);
            expect(store.addressHasValue()).toBe(false);
          });

          it('has loading status when loading', () => {
            const { store, addressResolver } = setupWithNamedResource();

            addressResolver.resolve.mockResolvedValue(venice);
            patchState(store, { id: 1 });

            expect(store.addressStatus()).toBe('loading');
            expect(store.addressValue()).toBeUndefined();
            expect(store.addressError()).toBeUndefined();
            expect(store.addressIsLoading()).toBe(true);
            expect(store.addressHasValue()).toBe(false);
          });

          it('has resolved status when loaded', async () => {
            const { store, addressResolver } = setupWithNamedResource();

            addressResolver.resolve.mockResolvedValue(venice);
            patchState(store, { id: 1 });

            await wait();

            expect(store.addressStatus()).toBe('resolved');
            expect(store.addressValue()).toEqual(venice);
            expect(store.addressError()).toBeUndefined();
            expect(store.addressIsLoading()).toBe(false);
            expect(store.addressHasValue()).toBe(true);
          });

          it('has error status when error', async () => {
            const { store, addressResolver } = setupWithNamedResource();

            addressResolver.resolve.mockRejectedValue(new Error('Error'));
            patchState(store, { id: 1 });
            await wait();

            expect(store.addressStatus()).toBe('error');
            expect(() => store.addressValue()).toThrow();
            expect(store.addressError()).toBeInstanceOf(Error);
            expect(store.addressIsLoading()).toBe(false);
            expect(store.addressHasValue()).toBe(false);
          });

          it('has local once updated', async () => {
            const { store, addressResolver } = setupWithNamedResource();

            addressResolver.resolve.mockResolvedValue(venice);
            patchState(store, { id: 1 });

            await wait();
            patchState(store, ({ addressValue }) => ({
              addressValue: addressValue
                ? { ...addressValue, country: 'Italia' }
                : undefined,
            }));

            expect(store.addressStatus()).toBe('local');
            expect(store.addressValue()?.country).toBe('Italia');
            expect(store.addressError()).toBeUndefined();
            expect(store.addressIsLoading()).toBe(false);
            expect(store.addressHasValue()).toBe(true);
          });

          it('can also reload by resource name', async () => {
            const { store, addressResolver } = setupWithNamedResource();

            addressResolver.resolve.mockResolvedValueOnce(venice);
            patchState(store, { id: 1 });
            await wait();
            expect(store.addressStatus()).toBe('resolved');
            store.reload();
            expect(store.addressStatus()).toBe('reloading');
          });
        });
      });

      describe('override protection', () => {
        const warningSpy = jest.spyOn(console, 'warn');

        afterEach(() => {
          warningSpy.mockClear();
        });

        for (const memberName of [
          //TODO wait for https://github.com/ngrx/platform/pull/4932
          // 'value',
          'status',
          'error',
          'isLoading',
          '_reload',
          'hasValue',
        ]) {
          it(`warns if ${memberName} is not a member of the store`, () => {
            const Store = signalStore(
              { providedIn: 'root' },
              withProps(() => ({ [memberName]: true })),
              withResource(() =>
                resource({ loader: () => Promise.resolve(1) }),
              ),
            );

            TestBed.inject(Store);

            expect(warningSpy).toHaveBeenCalledWith(
              '@ngrx/signals: SignalStore members cannot be overridden.',
              'Trying to override:',
              memberName,
            );
          });
        }

        //TODO wait for https://github.com/ngrx/platform/pull/4932
        it.skip('also checks for named resources', () => {
          const Store = signalStore(
            { providedIn: 'root' },
            withState({ userValue: 1 }),
            withResource(() => ({
              user: resource({
                loader: () => Promise.resolve(1),
              }),
            })),
          );

          TestBed.inject(Store);

          expect(warningSpy).toHaveBeenCalledWith(
            '@ngrx/signals: SignalStore members cannot be overridden.',
            'Trying to override:',
            'userValue',
          );
        });
      });

      it('works also with list/detail use case', async () => {
        const Store = signalStore(
          { providedIn: 'root', protectedState: false },
          withState({ id: undefined as number | undefined }),
          withResource(({ id }) => ({
            list: httpResource<{ id: number; name: string }[]>(
              () => '/address',
              {
                defaultValue: [],
              },
            ),
            detail: httpResource<Address>(() =>
              id() ? `/address/${id()}` : undefined,
            ),
          })),
        );

        TestBed.configureTestingModule({
          providers: [provideHttpClient(), provideHttpClientTesting()],
        });

        const store = TestBed.inject(Store);
        const ctrl = TestBed.inject(HttpTestingController);

        expect(store.listValue()).toEqual([]);
        expect(store.detailValue()).toBeUndefined();
        await wait();
        ctrl.expectOne('/address').flush([{ id: 1, name: 'Italy' }]);

        await wait();
        expect(store.listValue()).toEqual([{ id: 1, name: 'Italy' }]);
        expect(store.detailValue()).toBeUndefined();

        patchState(store, { id: 1 });
        await wait();
        ctrl.expectOne('/address/1').flush(venice);
        await wait();
        expect(store.listValue()).toEqual([{ id: 1, name: 'Italy' }]);
        expect(store.detailValue()).toEqual(venice);
      });
    });
  });

  describe('Type Tests', () => {
    describe('unnamed resource', () => {
      it('satisfies the Resource interface without default value', () => {
        const Store = signalStore(
          { providedIn: 'root' },
          withResource(() => resource({ loader: () => Promise.resolve(1) })),
        );
        TestBed.inject(Store) satisfies Resource<number | undefined>;
      });

      it('satisfies the Resource interface with default value', () => {
        const Store = signalStore(
          { providedIn: 'root' },
          withResource(() =>
            resource({ loader: () => Promise.resolve(1), defaultValue: 0 }),
          ),
        );
        TestBed.inject(Store) satisfies Resource<number>;
      });

      it('provides hasValue as type predicate when explicitly typed', () => {
        const Store = signalStore(
          { providedIn: 'root' },
          withResource(() => resource({ loader: () => Promise.resolve(1) })),
        );
        const store: Resource<number | undefined> = TestBed.inject(Store);
        if (store.hasValue()) {
          store.value() satisfies number;
        }
      });

      it('fails on hasValue as type predicate when not explicitly typed', () => {
        const Store = signalStore(
          { providedIn: 'root' },
          withResource(() => resource({ loader: () => Promise.resolve(1) })),
        );
        const store = TestBed.inject(Store);
        if (store.hasValue()) {
          // @ts-expect-error - we want to test the type error
          store.value() satisfies number;
        }
      });

      it('does not have access to the STATE_SOURCE', () => {
        signalStore(
          withState({ id: 1 }),
          withResource((store) =>
            resource({
              params: store.id,
              loader: ({ params: id }) => {
                // @ts-expect-error - we want to test the type error
                patchState(store, { id: 0 });

                return Promise.resolve(id + 1);
              },
            }),
          ),
        );
      });
    });

    describe('named resources', () => {
      it('does not have access to the STATE_SOURCE', () => {
        signalStore(
          withState({ id: 1 }),
          withResource((store) => ({
            user: resource({
              params: store.id,
              loader: ({ params: id }) => {
                // @ts-expect-error - we want to test the type error
                patchState(store, { id: 0 });

                return Promise.resolve(id + 1);
              },
            }),
          })),
        );
      });
    });

    it('shoud allow different resource types with named resources', () => {
      const Store = signalStore(
        { providedIn: 'root' },
        withResource(() => ({
          id: resource({
            loader: () => Promise.resolve(1),
            defaultValue: 0,
          }),
        })),
        withResource(() => ({
          word: resource({
            loader: () => Promise.resolve('hello'),
            defaultValue: '',
          }),
        })),
        withResource(() => ({
          optionalId: resource({
            loader: () => Promise.resolve(1),
          }),
        })),
      );

      const store = TestBed.inject(Store);

      store.idValue satisfies Signal<number>;
      store.wordValue satisfies Signal<string>;
      store.optionalIdValue satisfies Signal<number | undefined>;
    });

    describe('mapToResource', () => {
      it('satisfies the Resource interface without default value', () => {
        const Store = signalStore(
          { providedIn: 'root' },
          withResource(() => ({
            id: resource({ loader: () => Promise.resolve(1) }),
          })),
        );

        const store = TestBed.inject(Store);
        mapToResource(store, 'id') satisfies Resource<number | undefined>;
      });

      it('satisfies the Resource interface with default value', () => {
        const Store = signalStore(
          { providedIn: 'root' },
          withResource(() => ({
            id: resource({ loader: () => Promise.resolve(1), defaultValue: 0 }),
          })),
        );

        const store = TestBed.inject(Store);
        mapToResource(store, 'id') satisfies Resource<number>;
      });

      it('provides hasValue as type predicate', () => {
        const Store = signalStore(
          { providedIn: 'root' },
          withResource(() => ({
            id: resource({ loader: () => Promise.resolve(1) }),
          })),
        );

        const store = TestBed.inject(Store);
        const res = mapToResource(store, 'id');

        if (res.hasValue()) {
          res.value() satisfies number;
        }
      });

      describe('resource name checks', () => {
        const setup = () => {
          const Store = signalStore(
            { providedIn: 'root' },
            withState({ key: 1, work: 'test' }),
            withResource(() => ({
              id: resource({ loader: () => Promise.resolve(1) }),
              word: resource({ loader: () => Promise.resolve('hello') }),
            })),
          );

          return TestBed.inject(Store);
        };

        it('allows passing id as a valid resource name', () => {
          const store = setup();
          mapToResource(store, 'id') satisfies Resource<number | undefined>;
        });

        it('allows passing word as a valid resource name', () => {
          const store = setup();
          mapToResource(store, 'word') satisfies Resource<string | undefined>;
        });

        it('fails when passing key as a resource name', () => {
          const store = setup();
          // @ts-expect-error - we want to test the type error
          mapToResource(store, 'key');
        });
      });

      it('fails when Resource properties are not fully defined', () => {
        const Store = signalStore(withState({ userValue: 0 }));

        const store = new Store();
        // @ts-expect-error - we want to test the type error
        mapToResource(store, 'user');
      });
    });
  });
});
