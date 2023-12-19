# NgRx Toolkit

<p align="center">
<img src="https://raw.githubusercontent.com/angular-architects/ngrx-toolkit/main/logo.png" width="320" style="text-align: center">
</p>

NgRx Toolkit is an extension to the NgRx Signals Store. **It is still in beta** but already offers following features:

- Devtools: Integration into Redux Devtools
- Redux: Possibility to use the Redux Pattern (Reducer, Actions, Effects)

To install it, run

```shell
npm i @angular-architects/ngrx-toolkit
```

## Devtools: `withDevtools()`

This extension is very easy to use. Just add it to a `signalStore`. Example:

```typescript
export const FlightStore = signalStore(
  { providedIn: 'root' },
  withDevtools('flights'), // <-- add this
  withState({ flights: [] as Flight[] }),
  // ...
);
```

## Redux: `withRedux()`

`withRedux()` bring back the Redux pattern into the Signal Store.

It can be combined with any other extension of the Signal Store.

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
            httpClient.get<Flight[]>(
              'https://demo.angulararchitects.io/api/flight',
              {
                params: new HttpParams().set('from', from).set('to', to),
              },
            ),
          ),
          tap((flights) => actions.loaded({ flights })),
        ),
      };
    },
  }),
);
```

