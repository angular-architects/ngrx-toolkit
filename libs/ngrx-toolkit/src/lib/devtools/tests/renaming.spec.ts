import { signalStore, withState } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import { Component, inject, OnInit } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { setupExtensions } from './helpers';

describe('withDevtools / renaming', () => {
  it('should allow to rename before first sync', async () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight')
    );

    @Component({
      selector: 'app-flight-search',
      template: ``,
      standalone: true,
      providers: [Store],
    })
    class FlightSearchComponent {
      store = inject(Store);

      constructor() {
        this.store.renameDevtoolsName('flights');
      }
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

    await RouterTestingHarness.create('flight');
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { flights: { name: 'Product', price: 10.5 } }
    );
  });

  it('should throw on renaming after first synchronization', async () => {
    setupExtensions();

    const Store = signalStore(
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight')
    );

    @Component({
      selector: 'app-flight-search',
      template: ``,
      standalone: true,
      providers: [Store],
    })
    class FlightSearchComponent implements OnInit {
      store = inject(Store);

      ngOnInit() {
        this.store.renameDevtoolsName('flights');
      }
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

    await expect(RouterTestingHarness.create('flight')).rejects.toThrow(
      'NgRx Toolkit/DevTools: cannot rename from flight to flights. flight has already been send to DevTools.'
    );
  });

  it('should throw if name already exists', async () => {
    const { sendSpy } = setupExtensions();

    const FlightStore = signalStore(withDevtools('flight'));

    const FlightSearchStore = signalStore(withDevtools('flightSearch'));

    @Component({
      selector: 'app-root',
      template: '<router-outlet />',
      standalone: true,
      imports: [RouterOutlet],
      providers: [FlightStore],
    })
    class AppComponent {
      store = inject(FlightStore);
    }

    @Component({
      selector: 'app-flight-search',
      template: ``,
      standalone: true,
      providers: [FlightSearchStore],
    })
    class FlightSearchComponent {
      store = inject(FlightSearchStore);

      constructor() {
        this.store.renameDevtoolsName('flight');
      }
    }

    @Component({ selector: 'app-home', template: ``, standalone: true })
    class HomeComponent {}

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: AppComponent,
            children: [
              { path: '', component: HomeComponent },
              { path: 'search', component: FlightSearchComponent },
            ],
          },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create('');
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { flight: {} }
    );

    await expect(harness.navigateByUrl('search')).rejects.toThrow(
      'NgRx Toolkit/DevTools: cannot rename from flightSearch to flight. flight already exists.'
    );
  });
});
