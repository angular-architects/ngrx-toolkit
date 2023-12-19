import { patchState, signalStore, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  provideHttpClient,
} from '@angular/common/http';
import { map, switchMap, tap } from 'rxjs';
import { noPayload, payload, withRedux } from './with-redux';
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

interface Flight {
  id: number;
  from: string;
  to: string;
  delayed: boolean;
  date: Date;
}

let currentId = 1;

const createFlight = (flight: Partial<Flight> = {}) => {
  return {
    ...{
      id: currentId++,
      from: 'Vienna',
      to: 'London',
      delayed: false,
      date: new Date(2024, 0, 1),
    },
    ...flight,
  };
};

describe('with redux', () => {
  it('should load flights', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    TestBed.runInInjectionContext(() => {
      const controller = TestBed.inject(HttpTestingController);
      const FlightsStore = signalStore(
        withState({ flights: [] as Flight[] }),
        withRedux({
          actions: {
            public: {
              loadFlights: payload<{ from: string; to: string }>(),
              delayFirst: noPayload,
            },
            private: {
              flightsLoaded: payload<{ flights: Flight[] }>(),
            },
          },

          reducer: (actions, on) => {
            on(actions.flightsLoaded, ({ flights }, state) => {
              patchState(state, { flights });
            });
          },

          effects: (actions, create) => {
            const httpClient = inject(HttpClient);

            return {
              loadFlights$: create(actions.loadFlights).pipe(
                switchMap(({ from, to }) => {
                  return httpClient.get<Flight[]>(
                    'https://www.angulararchitects.io',
                    {
                      params: new HttpParams().set('from', from).set('to', to),
                    }
                  );
                }),
                map((flights) => actions.flightsLoaded({ flights }))
              ),
            };
          },
        })
      );

      const flightsStore = new FlightsStore();
      flightsStore.loadFlights({ from: 'Vienna', to: 'London' });
      const flight = createFlight();
      controller
        .expectOne((req) =>
          req.url.startsWith('https://www.angulararchitects.io')
        )
        .flush([flight]);

      expect(flightsStore.flights()).toEqual([flight]);

      controller.verify();
    });
  });
});
