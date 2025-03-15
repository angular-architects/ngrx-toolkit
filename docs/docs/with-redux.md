---
title: withRedux()
---

```typescript
import { withRedux } from '@angular-architects/ngrx-toolkit';
```

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

### Configuring the Redux Devtools Extension

The `provideDevtoolsConfig` function allows you to configure the Redux DevTools integration for your NgRx SignalStore. This function is essential for setting up the DevTools with custom options. The function only needs to be called once in your appConfig or AppModule.

To use `provideDevtoolsConfig`, you need to import it and call it in your providers array.

Here is an example of how to use it with the standalone api:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideDevtoolsConfig } from '@angular-architects/ngrx-toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDevtoolsConfig({
      name: 'MyApp',
    }),
  ],
};

// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config.ts';

await bootstrapApplication(AppComponent, appConfig);
```

### Additional Information

For more details on the available options and their usage, refer to the [Redux DevTools Extension documentation](https://github.com/reduxjs/redux-devtools).
