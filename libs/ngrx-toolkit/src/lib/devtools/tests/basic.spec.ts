import { setupExtensions } from './helpers';
import { TestBed } from '@angular/core/testing';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
} from '@angular/core';
import { renameDevtoolsName } from '../rename-devtools-name';

describe('Devtools Basics', () => {
  it('should dispatch update', () => {
    const { sendSpy } = setupExtensions();
    TestBed.inject(
      signalStore(
        { providedIn: 'root' },
        withDevtools('shop'),
        withState({ name: 'Car' })
      )
    );
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { shop: { name: 'Car' } }
    );
  });

  it('should add multiple stores as feature stores', () => {
    const { sendSpy } = setupExtensions();
    for (const name of ['category', 'booking']) {
      TestBed.inject(signalStore({ providedIn: 'root' }, withDevtools(name)));
    }
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: 'Store Update' },
      {
        category: {},
        booking: {},
      }
    );
  });

  it('should remove the state once destroyed', () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(withDevtools('flight'));
    const childInjector = createEnvironmentInjector(
      [Store],
      TestBed.inject(EnvironmentInjector)
    );

    childInjector.get(Store);
    TestBed.flushEffects();

    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { flight: {} }
    );

    childInjector.destroy();
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith({ type: 'Store Update' }, {});
  });

  it('should remove a renamed state once destroyed', () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(withDevtools('flight'));
    const childInjector = createEnvironmentInjector(
      [Store],
      TestBed.inject(EnvironmentInjector)
    );

    const store = childInjector.get(Store);
    TestBed.flushEffects();

    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { flight: {} }
    );

    renameDevtoolsName(store, 'flights');
    childInjector.destroy();
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith({ type: 'Store Update' }, {});
  });

  it('should group multiple patchState running before the synchronization', () => {
    const { sendSpy } = setupExtensions();
    const store = TestBed.inject(
      signalStore(
        { providedIn: 'root' },
        withDevtools('shop'),
        withState({ name: 'Car', amount: 0 }),
        withMethods((store) => ({
          increment() {
            patchState(store, (value) => ({
              ...value,
              amount: value.amount + 1,
            }));
          },
        }))
      )
    );

    store.increment();
    store.increment();
    TestBed.flushEffects();

    expect(sendSpy.mock.calls).toEqual([
      [{ type: 'Store Update' }, { shop: { name: 'Car', amount: 2 } }],
    ]);
  });
});
