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

  it('should add multiple store as feature stores', () => {
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
});
