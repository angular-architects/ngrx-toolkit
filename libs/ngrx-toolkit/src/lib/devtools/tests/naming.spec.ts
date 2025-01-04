import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { setupExtensions } from './helpers';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { renameDevtoolsName } from '../rename-devtools-name';

describe('withDevtools / renaming', () => {
  it('should automatically index multiple instances', () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withDevtools('flights'),
      withState({ airline: 'Lufthansa' })
    );

    const childContext = createEnvironmentInjector(
      [Store],
      TestBed.inject(EnvironmentInjector)
    );

    TestBed.inject(Store);
    runInInjectionContext(childContext, () => inject(Store));

    TestBed.flushEffects();

    expect(sendSpy).lastCalledWith(
      { type: 'Store Update' },
      {
        flights: { airline: 'Lufthansa' },
        'flights-1': { airline: 'Lufthansa' },
      }
    );
  });

  it('not index, if multiple instances do not exist simultaneously', () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      withDevtools('flights'),
      withState({ airline: 'Lufthansa' })
    );

    const envInjector = TestBed.inject(EnvironmentInjector);
    const childContext1 = createEnvironmentInjector([Store], envInjector);
    const childContext2 = createEnvironmentInjector([Store], envInjector);

    runInInjectionContext(childContext1, () => inject(Store));
    TestBed.flushEffects();
    childContext1.destroy();

    expect(sendSpy.mock.calls).toEqual([
      [
        { type: 'Store Update' },
        {
          flights: { airline: 'Lufthansa' },
        },
      ],
    ]);

    runInInjectionContext(childContext2, () => inject(Store));
    TestBed.flushEffects();
    expect(sendSpy.mock.calls).toEqual([
      [
        { type: 'Store Update' },
        {
          flights: { airline: 'Lufthansa' },
        },
      ],
      [
        { type: 'Store Update' },
        {
          flights: { airline: 'Lufthansa' },
        },
      ],
    ]);
  });

  it('should throw if automatic indexing is disabled', () => {
    setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withDevtools('flights', { indexNames: false }),
      withState({ airline: 'Lufthansa' })
    );

    const childContext = createEnvironmentInjector(
      [Store],
      TestBed.inject(EnvironmentInjector)
    );

    TestBed.inject(Store);
    expect(() =>
      runInInjectionContext(childContext, () => inject(Store))
    ).toThrow(
      `An instance of the store flights already exists. \
Enable automatic indexing via withDevTools('flights', { indexNames: true }), or rename it upon instantiation.`
    );
  });

  it('should throw if name already exists', () => {
    const { sendSpy } = setupExtensions();
    signalStore(withDevtools('flights'));
    expect(() => signalStore(withDevtools('flights'))).toThrow(
      'The store "flights" has already been registered in the DevTools. Duplicate registration is not allowed.'
    );
  });

  describe('renaming', () => {
    it('should allow to rename the store before first sync', () => {
      const { sendSpy } = setupExtensions();

      const Store = signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 }),
        withDevtools('flight')
      );

      const store = TestBed.inject(Store);
      renameDevtoolsName(store, 'flights');
      TestBed.flushEffects();

      expect(sendSpy).toHaveBeenCalledWith(
        { type: 'Store Update' },
        { flights: { name: 'Product', price: 10.5 } }
      );
    });

    it('should also rename after sync', () => {
      const { sendSpy } = setupExtensions();
      const Store = signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 }),
        withDevtools('flight')
      );
      const store = TestBed.inject(Store);

      TestBed.flushEffects();
      renameDevtoolsName(store, 'flights');
      TestBed.flushEffects();

      expect(sendSpy).toHaveBeenCalledWith(
        { type: 'Store Update' },
        { flights: { name: 'Product', price: 10.5 } }
      );
    });

    it('should throw on rename if name already exists', () => {
      setupExtensions();
      signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 }),
        withDevtools('shop')
      );

      const Store2 = signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 }),
        withDevtools('mall')
      );
      const store = TestBed.inject(Store2);
      TestBed.flushEffects();

      expect(() => renameDevtoolsName(store, 'shop')).toThrow(
        'NgRx Toolkit/DevTools: cannot rename from mall to shop. mall has already been send to DevTools.'
      );
    });

    it('should throw if applied to a SignalStore without DevTools', () => {
      setupExtensions();
      const Store = signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 })
      );

      const store = TestBed.inject(Store);

      expect(() => renameDevtoolsName(store, 'shop')).toThrow(
        "Devtools extensions haven't been added to this store."
      );
    });
  });
});
