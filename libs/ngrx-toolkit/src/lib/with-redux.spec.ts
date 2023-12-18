import { patchState, signalStore, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, switchMap } from 'rxjs';
import { noPayload, payload, withRedux } from './with-redux';

type Flight = { id: number };

describe('with redux', () => {
  it('should load flights', () => {
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

          create(actions.loadFlights).pipe(
            switchMap(({ from, to }) => {
              return httpClient.get<Flight[]>('www.angulararchitects.io', {
                params: new HttpParams().set('from', from).set('to', to),
              });
            }),
            map((flights) => actions.flightsLoaded({ flights }))
          );
        },
      })
    );

    const flightsStore = new FlightsStore();
  });
});
