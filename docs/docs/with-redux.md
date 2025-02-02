---
title: withRedux()
---

`withRedux()` brings back the Redux pattern into the Signal Store.

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
      on(actions.loaded, (state, { flights }) => {
        updateState(state, 'flights loaded', { flights });
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
```

## Extracting actions, reducer and effects into separate files

`createReducer` and `createEffects` allow you to extract the reducer and effects into separate files.

There is no need for a `createActions` function, because the actions are just an object literal.

Example:

```typescript
interface FlightState {
  flights: Flight[];
  effect1: boolean;
  effect2: boolean;
}

const initialState: FlightState = {
  flights: [],
  effect1: false,
  effect2: false,
};

// this can be in a separate file
const actions = {
  init: noPayload,
  updateEffect1: payload<{ value: boolean }>(),
  updateEffect2: payload<{ value: boolean }>(),
};

// this can be in a separate file
const reducer = createReducer<FlightState, typeof actions>((actions, on) => {
  on(actions.updateEffect1, (state, { value }) => {
    updateState(state, 'update effect 1', { effect1: value });
  });

  on(actions.updateEffect2, (state, { value }) => {
    updateState(state, 'update effect 2', { effect2: value });
  });
});

// this can be in a separate file
const effects = createEffects(actions, (actions, create) => {
  return {
    init1$: create(actions.init).pipe(map(() => actions.updateEffect1({ value: true }))),
    init2$: create(actions.init).pipe(map(() => actions.updateEffect2({ value: true }))),
  };
});

signalStore(
  withState(initialState),
  withRedux({
    actions,
    effects,
    reducer,
  })
);
```
