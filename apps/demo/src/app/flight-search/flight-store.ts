import { signalStore, withState } from '@ngrx/signals';
import {
  noPayload,
  payload,
  withDevtools,
  withRedux,
  patchState,
} from 'ngrx-toolkit';
import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, switchMap } from 'rxjs';
import { Flight } from './flight';

export const FlightStore = signalStore(
  { providedIn: 'root' },
  withDevtools('flights'),
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
        patchState(state, 'flights loaded', { flights });
      });
    },

    effects: (actions, create) => {
      const httpClient = inject(HttpClient);

      return {
        loadFlights$: create(actions.loadFlights).pipe(
          switchMap(({ from, to }) => {
            return httpClient.get<Flight[]>(
              'https://demo.angulararchitects.io/api/flight',
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
