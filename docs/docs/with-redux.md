`withRedux()` bring back the Redux pattern into the Signal Store.

It can be combined with any other extension of the Signal Store.

:::note
Please note, that there is an [official RFC](https://github.com/ngrx/platform/issues/4580) that a Redux extension will be added to the SignalStore in the future.

If you use `withRedux`, you will probably need to refactor your store when the official Redux extension is released.
:::

There is also a [Redux Connector](./create-redux-state) available, which is a separate package and has a dependency to `@ngrx/store`.

Example:

```typescript
export const FlightStore = signalStore(
  { providedIn: 'root' },
  withState({ flights: [] as Flight[] }),
  withRedux({
    actions: {
      public: {
        load: payload<{ from: string; to: string }>(),
      },
      private: {
        loaded: payload<{ flights: Flight[] }>(),
      },
    },
    reducer(actions, on) {
      on(actions.loaded, ({ flights }, state) => {
        patchState(state, 'flights loaded', { flights });
      });
    },
    effects(actions, create) {
      const httpClient = inject(HttpClient);
      return {
        load$: create(actions.load).pipe(
          switchMap(({ from, to }) =>
            httpClient.get<Flight[]>('https://demo.angulararchitects.io/api/flight', {
              params: new HttpParams().set('from', from).set('to', to),
            })
          ),
          tap((flights) => actions.loaded({ flights }))
        ),
      };
    },
  })
);
