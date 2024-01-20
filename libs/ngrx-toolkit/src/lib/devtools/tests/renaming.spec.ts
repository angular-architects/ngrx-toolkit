import { signalStore, withState } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { setupExtensions } from './helpers';

describe('withDevtools / renaming', () => {
  it('should allow to rename before first sync', waitForAsync(async () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight'),
    );

    const store = TestBed.inject(Store);
    store.renameDevtoolsName('flights');
    TestBed.flushEffects();

    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { flights: { name: 'Product', price: 10.5 } },
    );
  }));

  it('throw on rename after sync', waitForAsync(async () => {
    setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight'),
    );
    const store = TestBed.inject(Store);

    TestBed.flushEffects();

    expect(() => store.renameDevtoolsName('flights')).toThrow(
      'NgRx Toolkit/DevTools: cannot rename from flight to flights. flight has already been send to DevTools.',
    );
  }));

  it('should throw if name already exists', waitForAsync(async () => {
    setupExtensions();
    signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('shop'),
    );

    const Store2 = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('mall'),
    );
    const store = TestBed.inject(Store2);
    TestBed.flushEffects();

    expect(() => store.renameDevtoolsName('shop')).toThrow(
      'NgRx Toolkit/DevTools: cannot rename from mall to shop. mall has already been send to DevTools.',
    );
  }));
});
