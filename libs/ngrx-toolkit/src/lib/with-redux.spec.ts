import { signalStore } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs';
import { noPayload, payload, withRedux } from './with-redux';

type Flight = { id: number };

describe('with redux', () => {
  it('should load flights', () => {
    const FlightsStore = signalStore(
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

        reducer: (on, actions) => {
          on(actions.loadFlights, (action, state) => state);
          on(actions.flightsLoaded, (action, state) => state);
        },

        effects: (actions, create) => {
          const httpClient = inject(HttpClient);

          create(actions.loadFlights).pipe(
            switchMap(({ from, to }) =>
              httpClient.get<Flight[]>('www.angulararchitects.io', {
                params: { from, to },
              })
            ),
            map((flights) => actions.flightsLoaded)
          );
        },
      })
    );

    const flightsStore = new FlightsStore();
  });
});
