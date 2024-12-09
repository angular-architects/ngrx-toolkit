import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { setupExtensions } from './helpers';
import { Component, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

describe('withDevtools / renaming', () => {
  it('should automatically index multiple instances', waitForAsync(() => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      withDevtools('flights'),
      withState({ airline: 'Lufthansa' })
    );

    @Component({
      template: '',
      standalone: true,
      providers: [Store],
    })
    class FlightComponent {
      store = inject(Store);
    }

    TestBed.configureTestingModule({
      imports: [FlightComponent],
      providers: [Store],
    }).createComponent(FlightComponent);
    TestBed.inject(Store);

    TestBed.flushEffects();

    expect(sendSpy).lastCalledWith(
      { type: 'Store Update' },
      {
        flights: { airline: 'Lufthansa' },
        'flights-1': { airline: 'Lufthansa' },
      }
    );
  }));

  it('not index, if multiple instances do not exist simultaneously', waitForAsync(async () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      withDevtools('flights'),
      withState({ airline: 'Lufthansa' })
    );

    @Component({
      selector: 'app-flights',
      template: '',
      standalone: true,
      providers: [Store],
    })
    class FlightComponent {
      store = inject(Store);
    }

    @Component({
      selector: 'app-home',
      template: '',
      standalone: true,
      providers: [Store],
    })
    class HomeComponent {
      store = inject(Store);
    }

    TestBed.configureTestingModule({
      imports: [FlightComponent],
      providers: [
        Store,
        provideRouter([
          { path: 'home', component: HomeComponent },
          { path: 'flights', component: FlightComponent },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create('/home');

    expect(sendSpy.mock.calls).toEqual([
      [
        { type: 'Store Update' },
        {
          flights: { airline: 'Lufthansa' },
        },
      ],
    ]);

    await harness.navigateByUrl('flights');

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
  }));

  it('should throw if automatic indexing is disabled', waitForAsync(() => {
    const Store = signalStore(
      withDevtools('flights', { indexNames: false }),
      withState({ airline: 'Lufthansa' })
    );

    @Component({
      template: '',
      standalone: true,
      providers: [Store],
    })
    class FlightComponent {
      store = inject(Store);
    }

    TestBed.configureTestingModule({
      imports: [FlightComponent],
      providers: [Store],
    }).createComponent(FlightComponent);

    const store = TestBed.inject(Store);

    expect(() => TestBed.inject(Store)).not.toThrow();
  }));

  it('should index unique names', () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withState({ airline: 'Lufthansa' }),
      withDevtools('flights')
    );
    const StoreIx1 = signalStore(
      { providedIn: 'root' },
      withState({ airline: 'Austrian' }),
      withDevtools('flights'),
      withMethods((store) => ({
        setAirline(airline: string) {
          patchState(store, { airline });
        },
      }))
    );
    const StoreIx2 = signalStore(
      { providedIn: 'root' },
      withState({ airline: 'British Airways' }),
      withDevtools('flights'),
      withMethods((store) => ({
        setAirline(airline: string) {
          patchState(store, { airline });
        },
      }))
    );
    const store = TestBed.inject(Store);
    const storeIx1 = TestBed.inject(StoreIx1);
    const storeIx2 = TestBed.inject(StoreIx2);

    storeIx1.setAirline('Austrian Airlines');
    storeIx2.setAirline('BA');

    TestBed.flushEffects();

    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      {
        flights: { airline: 'Lufthansa' },
        'flights-1': { airline: 'Austrian Airlines' },
        'flights-2': { airline: 'BA' },
      }
    );
  });

  it('should throw if indexing is disabled', () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withState({ airline: 'Lufthansa' }),
      withDevtools('flights', { indexNames: false })
    );
    const StoreIx1 = signalStore(
      { providedIn: 'root' },
      withState({ airline: 'Austrian' }),
      withDevtools('flights')
    );
  });

  it.todo(
    'should throw on multiple instance of a signal store if indexing is disabled'
  );
  it.todo(
    'should throw immediately if a signal store is defined with an existing name'
  );

  it('should allow to rename the store before first sync', waitForAsync(async () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight')
    );

    const store = TestBed.inject(Store);
    store.renameDevtoolsName('flights');
    TestBed.flushEffects();

    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { flights: { name: 'Product', price: 10.5 } }
    );
  }));

  it('should throw on rename after sync', waitForAsync(async () => {
    setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight')
    );
    const store = TestBed.inject(Store);

    TestBed.flushEffects();

    expect(() => store.renameDevtoolsName('flights')).toThrow(
      'NgRx Toolkit/DevTools: cannot rename from flight to flights. flight has already been send to DevTools.'
    );
  }));

  it('should throw on rename if name already exists', waitForAsync(async () => {
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

    expect(() => store.renameDevtoolsName('shop')).toThrow(
      'NgRx Toolkit/DevTools: cannot rename from mall to shop. mall has already been send to DevTools.'
    );
  }));
});
