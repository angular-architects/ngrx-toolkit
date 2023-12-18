import { signalStore } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs';
import { createActions, payload, withRedux } from './with-redux';
import { TestBed } from '@angular/core/testing';

type Flight = { id: number };

describe('with redux', () => {
  it('should load flights', () => {
    const FlightsStore = signalStore(
      withRedux({
        actions: createActions({
          public: {
            loadFlights: payload<{ from: string; to: string }>(),
          },
          private: {
            flightsLoaded: payload<{ flights: Flight[] }>(),
          },
        }),

        reducer: (on, actions) => {
          on(actions.loadFlights, (action, state) => state);
          on(actions.flightsLoaded, (action, state) => state);
        },

        effects: (actions, create) => {
          const httpCLient = inject(HttpClient);

          create(actions.loadFlights).pipe(
            switchMap(({ from, to }) =>
              httpCLient.get<Flight[]>('www.angulararchitects.io', {
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
