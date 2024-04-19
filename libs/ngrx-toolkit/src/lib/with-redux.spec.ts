import { patchState, signalStore, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  provideHttpClient,
} from '@angular/common/http';
import { map, switchMap } from 'rxjs';
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
            on(actions.flightsLoaded, (state, { flights }) => {
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
                    },
                  );
                }),
                map((flights) => actions.flightsLoaded({ flights })),
              ),
            };
          },
        }),
      );

      const flightsStore = new FlightsStore();
      flightsStore.loadFlights({ from: 'Vienna', to: 'London' });
      const flight = createFlight();
      controller
        .expectOne((req) =>
          req.url.startsWith('https://www.angulararchitects.io'),
        )
        .flush([flight]);

      expect(flightsStore.flights()).toEqual([flight]);

      controller.verify();
    });
  });

  it('should allow a noPayload action to call without parameters', () => {
    const FlightsStore = signalStore(
      withState({ flights: [] as Flight[] }),
      withRedux({
        actions: {
          init: noPayload,
        },
        reducer() {},
        effects() {
          return {};
        },
      }),
    );

    const flightStore = TestBed.configureTestingModule({
      providers: [FlightsStore],
    }).inject(FlightsStore);

    flightStore.init();
  });

  it('should allow multiple effects listening to the same action', () => {
    const FlightsStore = signalStore(
      withState({ flights: [] as Flight[], effect1: false, effect2: false }),
      withRedux({
        actions: {
          init: noPayload,
          updateEffect1: payload<{ value: boolean }>(),
          updateEffect2: payload<{ value: boolean }>(),
        },
        reducer(actions, on) {
          on(actions.updateEffect1, (state, { value }) => {
            patchState(state, { effect1: value });
          });

          on(actions.updateEffect2, (state, { value }) => {
            patchState(state, { effect2: value });
          });
        },
        effects(actions, create) {
          return {
            init1$: create(actions.init).pipe(
              map(() => actions.updateEffect1({ value: true })),
            ),
            init2$: create(actions.init).pipe(
              map(() => actions.updateEffect2({ value: true })),
            ),
          };
        },
      }),
    );

    const flightStore = TestBed.configureTestingModule({
      providers: [FlightsStore],
    }).inject(FlightsStore);

    flightStore.init();

    expect(flightStore.effect1()).toBe(true);
    expect(flightStore.effect2()).toBe(true);
  });
});
