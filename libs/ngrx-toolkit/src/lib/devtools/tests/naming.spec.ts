import {
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signalStore, withState } from '@ngrx/signals';
import { withDisabledNameIndices } from '../features/with-disabled-name-indicies';
import { renameDevtoolsName } from '../rename-devtools-name';
import { withDevtools } from '../with-devtools';
import { setupExtensions } from './helpers.spec';

describe('withDevtools / renaming', () => {
  it('should automatically index multiple instances', () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withDevtools('flights'),
      withState({ airline: 'Lufthansa' }),
    );

    const childContext = createEnvironmentInjector(
      [Store],
      TestBed.inject(EnvironmentInjector),
    );

    TestBed.inject(Store);
    runInInjectionContext(childContext, () => inject(Store));

    TestBed.flushEffects();

    expect(sendSpy).lastCalledWith(
      { type: 'Store Update' },
      {
        flights: { airline: 'Lufthansa' },
        'flights-1': { airline: 'Lufthansa' },
      },
    );
  });

  it('not index, if multiple instances do not exist simultaneously', () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      withDevtools('flights'),
      withState({ airline: 'Lufthansa' }),
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
      withDevtools('flights', withDisabledNameIndices()),
      withState({ airline: 'Lufthansa' }),
    );

    const childContext = createEnvironmentInjector(
      [Store],
      TestBed.inject(EnvironmentInjector),
    );

    TestBed.inject(Store);
    expect(() =>
      runInInjectionContext(childContext, () => inject(Store)),
    ).toThrow(
      `An instance of the store flights already exists. \
Enable automatic indexing via withDevTools('flights', { indexNames: true }), or rename it upon instantiation.`,
    );
  });

  it('should index for two different stores with same devtools name', () => {
    const { sendSpy } = setupExtensions();

    TestBed.inject(
      signalStore({ providedIn: 'root' }, withDevtools('flights')),
    );
    TestBed.inject(
      signalStore({ providedIn: 'root' }, withDevtools('flights')),
    );

    TestBed.flushEffects();
    expect(sendSpy.mock.calls).toEqual([
      [
        { type: 'Store Update' },
        {
          flights: {},
          'flights-1': {},
        },
      ],
    ]);
  });

  it('should throw for two different stores when indexing is disabled', () => {
    setupExtensions();

    TestBed.inject(
      signalStore({ providedIn: 'root' }, withDevtools('flights')),
    );
    expect(() =>
      TestBed.inject(
        signalStore(
          { providedIn: 'root' },
          withDevtools('flights', withDisabledNameIndices()),
        ),
      ),
    ).toThrow();
  });

  it('should not throw for two different stores if only the first one has indexing disabled', () => {
    setupExtensions();

    TestBed.inject(
      signalStore(
        { providedIn: 'root' },
        withDevtools('flights', withDisabledNameIndices()),
      ),
    );
    expect(() =>
      TestBed.inject(
        signalStore({ providedIn: 'root' }, withDevtools('flights')),
      ),
    ).not.toThrow();
  });

  describe('renaming', () => {
    it('should allow to rename the store before first sync', () => {
      const { sendSpy } = setupExtensions();

      const Store = signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 }),
        withDevtools('flight'),
      );

      const store = TestBed.inject(Store);
      renameDevtoolsName(store, 'flights');
      TestBed.flushEffects();

      expect(sendSpy).toHaveBeenCalledWith(
        { type: 'Store Update' },
        { flights: { name: 'Product', price: 10.5 } },
      );
    });

    it('should throw on rename if name already exists', () => {
      setupExtensions();
      const Store1 = signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 }),
        withDevtools('shop'),
      );

      const Store2 = signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 }),
        withDevtools('mall'),
      );
      TestBed.inject(Store1);
      const store = TestBed.inject(Store2);
      TestBed.flushEffects();

      expect(() => renameDevtoolsName(store, 'shop')).toThrow(
        'NgRx Toolkit/DevTools: cannot rename from mall to shop. shop is already assigned to another SignalStore instance.',
      );
    });

    it('should throw if applied to a SignalStore without DevTools', () => {
      setupExtensions();
      const Store = signalStore(
        { providedIn: 'root' },
        withState({ name: 'Product', price: 10.5 }),
      );

      const store = TestBed.inject(Store);

      expect(() => renameDevtoolsName(store, 'shop')).toThrow(
        "Devtools extensions haven't been added to this store.",
      );
    });

    it('should ignore rename after the store has been destroyed', () => {
      const { sendSpy } = setupExtensions();

      const Store = signalStore(
        withDevtools('flight'),
        withState({ name: 'Product', price: 10.5 }),
      );

      const childContext = createEnvironmentInjector(
        [Store],
        TestBed.inject(EnvironmentInjector),
      );

      const store = childContext.get(Store);
      TestBed.flushEffects();

      expect(sendSpy).toHaveBeenCalledWith(
        { type: 'Store Update' },
        { flight: { name: 'Product', price: 10.5 } },
      );

      childContext.destroy();
      TestBed.flushEffects();

      // Previously this could throw; now it is a no-op
      expect(() => renameDevtoolsName(store, 'flights')).not.toThrow();
    });
  });
});
