import { setupExtensions } from './helpers';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { patchState, signalStore, withState } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import { Component, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

describe('Devtools Basics', () => {
  it('should dispatch update', () => {
    const { sendSpy } = setupExtensions();
    TestBed.inject(
      signalStore(
        { providedIn: 'root' },
        withDevtools('shop'),
        withState({ name: 'Car' }),
      ),
    );
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { shop: { name: 'Car' } },
    );
  });

  it('add multiple store as feature stores', () => {
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
      },
    );
  });

  it('should remove the state once destroyed', waitForAsync(async () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(withDevtools('flight'));

    @Component({
      selector: 'app-flight-search',
      template: ``,
      standalone: true,
      providers: [Store],
    })
    class FlightSearchComponent {
      store = inject(Store);
    }

    @Component({ selector: 'app-home', template: ``, standalone: true })
    class HomeComponent {}

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: HomeComponent },
          { path: 'flight', component: FlightSearchComponent },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create('flight');
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { flight: {} },
    );
    await harness.navigateByUrl('/');
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith({ type: 'Store Update' }, {});
  }));

  it('should index unique names', () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withState({ airline: 'Lufthansa' }),
      withDevtools('flights'),
    );
    const StoreIx1 = signalStore(
      { providedIn: 'root' },
      withState({ airline: 'Austrian' }),
      withDevtools('flights'),
    );
    const StoreIx2 = signalStore(
      { providedIn: 'root' },
      withState({ airline: 'British Airways' }),
      withDevtools('flights'),
    );
    const store = TestBed.inject(Store);
    const storeIx1 = TestBed.inject(StoreIx1);
    const storeIx2 = TestBed.inject(StoreIx2);

    patchState(storeIx1, { airline: 'Austrian Airlines' });
    patchState(storeIx2, { airline: 'BA' });

    TestBed.flushEffects();

    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      {
        flights: { airline: 'Lufthansa' },
        'flights-1': { airline: 'Austrian Airlines' },
        'flights-2': { airline: 'BA' },
      },
    );
  });

  it('should provide name of action', () => {
    const { sendSpy } = setupExtensions();
    TestBed.inject(
      signalStore(
        { providedIn: 'root' },
        withDevtools('shop'),
        withState({ name: 'Car' }),
      ),
    );
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { shop: { name: 'Car' } },
    );
  });
});
