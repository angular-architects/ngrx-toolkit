# NgRx Toolkit

[![npm](https://img.shields.io/npm/v/%40angular-architects%2Fngrx-toolkit.svg)](https://www.npmjs.com/package/%40angular-architects%2Fngrx-toolkit)

<p align="center">
<img src="https://raw.githubusercontent.com/angular-architects/ngrx-toolkit/main/logo.png" width="320" style="text-align: center">
</p>

NgRx Toolkit is an extension to the NgRx Signals Store. **It is still in beta** but already offers features, like:

- Devtools: Integration into Redux Devtools
- Redux: Possibility to use the Redux Pattern (Reducer, Actions, Effects)
- Storage Sync: Synchronize the Store with Web Storage
- Redux Connector: Map NgRx Store Actions to a present Signal Store

To install it, run

```shell
npm i @angular-architects/ngrx-toolkit
```

Starting with 18.0.0-rc.2, we have a [strict version dependency](#why-is-the-version-range-to-the-ngrxsignals-dependency-so-strict) to `@ngrx/signals`:

| @ngrx/signals  | @angular-architects/ngrx-toolkit |
|----------------|----------------------------------|
| <= 18.0.0-rc.1 | 0.0.4                            |
| 18.0.0-rc.2    | 18.0.0-rc.2.x                    |

To install it, run

```shell
npm i @angular-architects/ngrx-toolkit
```


- [NgRx Toolkit](#ngrx-toolkit)
  - [Devtools: `withDevtools()`](#devtools-withdevtools)
  - [Redux: `withRedux()`](#redux-withredux)
  - [DataService `withDataService()`](#dataservice-withdataservice)
  - [DataService with Dynamic Properties](#dataservice-with-dynamic-properties)
  - [Storage Sync `withStorageSync`](#storage-sync-withstoragesync)
  - [Redux Connector for the NgRx Signal Store `createReduxState()`](#redux-connector-for-the-ngrx-signal-store-createreduxstate)
    - [Use a present Signal Store](#use-a-present-signal-store)
    - [Use well-known NgRx Store Actions](#use-well-known-ngrx-store-actions)
    - [Map Actions to Methods](#map-actions-to-methods)
    - [Register an Angular Dependency Injection Provider](#register-an-angular-dependency-injection-provider)
    - [Use the Store in your Component](#use-the-store-in-your-component)
  - [FAQ](#faq)
    - [Why is the version range to the `@ngrx/signals` dependency so strict?](#why-is-the-version-range-to-the-ngrxsignals-dependency-so-strict)
    - [I have an idea for a new extension, can I contribute?](#i-have-an-idea-for-a-new-extension-can-i-contribute)
    - [I require a feature that is not available in a lower version. What should I do?](#i-require-a-feature-that-is-not-available-in-a-lower-version-what-should-i-do)


## Devtools: `withDevtools()`

This extension is very easy to use. Just add it to a `signalStore`. Example:

```typescript
export const FlightStore = signalStore(
  { providedIn: 'root' },
  withDevtools('flights'), // <-- add this
  withState({ flights: [] as Flight[] })
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

## DataService `withDataService()`

`withDataService()` allows to connect a Data Service to the store:

This gives you a store for a CRUD use case:

```typescript
export const SimpleFlightBookingStore = signalStore(
  { providedIn: 'root' },
  withCallState(),
  withEntities<Flight>(),
  withDataService({
    dataServiceType: FlightService,
    filter: { from: 'Paris', to: 'New York' },
  }),
  withUndoRedo()
);
```

The features `withCallState` and `withUndoRedo` are optional, but when present, they enrich each other.

The Data Service needs to implement the `DataService` interface:

```typescript
@Injectable({
  providedIn: 'root'
})
export class FlightService implements DataService<Flight, FlightFilter> {
  loadById(id: EntityId): Promise<Flight> { ... }
  load(filter: FlightFilter): Promise<Flight[]> { ... }

  create(entity: Flight): Promise<Flight> { ... }
  update(entity: Flight): Promise<Flight> { ... }
  updateAll(entity: Flight[]): Promise<Flight[]> { ... }
  delete(entity: Flight): Promise<void> { ... }
  [...]
}
```

Once the store is defined, it gives its consumers numerous signals and methods they just need to delegate to:

```typescript
@Component(...)
export class FlightSearchSimpleComponent {
  private store = inject(SimpleFlightBookingStore);

  from = this.store.filter.from;
  to = this.store.filter.to;
  flights = this.store.entities;
  selected = this.store.selectedEntities;
  selectedIds = this.store.selectedIds;

  loading = this.store.loading;

  canUndo = this.store.canUndo;
  canRedo = this.store.canRedo;

  async search() {
    this.store.load();
  }

  undo(): void {
    this.store.undo();
  }

  redo(): void {
    this.store.redo();
  }

  updateCriteria(from: string, to: string): void {
    this.store.updateFilter({ from, to });
  }

  updateBasket(id: number, selected: boolean): void {
    this.store.updateSelected(id, selected);
  }

}
```

## DataService with Dynamic Properties

To avoid naming conflicts, the properties set up by `withDataService` and the connected features can be configured in a typesafe way:

```typescript
export const FlightBookingStore = signalStore(
  { providedIn: 'root' },
  withCallState({
    collection: 'flight',
  }),
  withEntities({
    entity: type<Flight>(),
    collection: 'flight',
  }),
  withDataService({
    dataServiceType: FlightService,
    filter: { from: 'Graz', to: 'Hamburg' },
    collection: 'flight',
  }),
  withUndoRedo({
    collections: ['flight'],
  })
);
```

This setup makes them use `flight` as part of the used property names. As these implementations respect the Type Script type system, the compiler will make sure these properties are used in a typesafe way:

```typescript
@Component(...)
export class FlightSearchDynamicComponent {
  private store = inject(FlightBookingStore);

  from = this.store.flightFilter.from;
  to = this.store.flightFilter.to;
  flights = this.store.flightEntities;
  selected = this.store.selectedFlightEntities;
  selectedIds = this.store.selectedFlightIds;

  loading = this.store.flightLoading;

  canUndo = this.store.canUndo;
  canRedo = this.store.canRedo;

  async search() {
    this.store.loadFlightEntities();
  }

  undo(): void {
    this.store.undo();
  }

  redo(): void {
    this.store.redo();
  }

  updateCriteria(from: string, to: string): void {
    this.store.updateFlightFilter({ from, to });
  }

  updateBasket(id: number, selected: boolean): void {
    this.store.updateSelectedFlightEntities(id, selected);
  }

}
```

## Storage Sync `withStorageSync()`

`withStorageSync` adds automatic or manual synchronization with Web Storage (`localstorage`/`sessionstorage`).

> [!WARNING]
> As Web Storage only works in browser environments it will fallback to a stub implementation on server environments.

Example:

```ts
const SyncStore = signalStore(
  withStorageSync<User>({
    key: 'synced', // key used when writing to/reading from storage
    autoSync: false, // read from storage on init and write on state changes - `true` by default
    select: (state: User) => Partial<User>, // projection to keep specific slices in sync
    parse: (stateString: string) => State, // custom parsing from storage - `JSON.parse` by default
    stringify: (state: User) => string, // custom stringification - `JSON.stringify` by default
    storage: () => sessionstorage, // factory to select storage to sync with
  })
);
```

```ts
@Component(...)
public class SyncedStoreComponent {
  private syncStore = inject(SyncStore);

  updateFromStorage(): void {
    this.syncStore.readFromStorage(); // reads the stored item from storage and patches the state
  }

  updateStorage(): void {
    this.syncStore.writeToStorage(); // writes the current state to storage
  }

  clearStorage(): void {
    this.syncStore.clearStorage(); // clears the stored item in storage
  }
}
```

## Redux Connector for the NgRx Signal Store `createReduxState()`

The Redux Connector turns any `signalStore()` into a Gobal State Management Slice following the Redux pattern.

It supports:

✅ Well-known NgRx Store Actions \
✅ Global Action `dispatch()` \
✅ Angular Lazy Loading \
✅ Auto-generated `provideNamedStore()` & `injectNamedStore()` Functions \
✅ Global Action to Store Method Mappers \


### Use a present Signal Store

```typescript
export const FlightStore = signalStore(
  // State
  withEntities({ entity: type<Flight>(), collection: 'flight' }),
  withEntities({ entity: type<number>(), collection: 'hide' }),
  // Selectors
  withComputed(({ flightEntities, hideEntities }) => ({
    filteredFlights: computed(() => flightEntities()
      .filter(flight => !hideEntities().includes(flight.id))),
    flightCount: computed(() => flightEntities().length),
  })),
  // Updater
  withMethods(store => ({
    setFlights: (state: { flights: Flight[] }) => patchState(store,
      setAllEntities(state.flights, { collection: 'flight' })),
    updateFlight: (state: { flight: Flight }) => patchState(store,
      updateEntity({ id: state.flight.id, changes: state.flight }, { collection: 'flight' })),
    clearFlights: () => patchState(store,
      removeAllEntities({ collection: 'flight' })),
  })),
  // Effects
  withMethods((store, flightService = inject(FlightService)) => ({
    loadFlights: reduxMethod<FlightFilter, { flights: Flight[] }>(pipe(
      switchMap(filter => from(
        flightService.load({ from: filter.from, to: filter.to })
      )),
      map(flights => ({ flights })),
    ), store.setFlights),
  })),
);
```

### Use well-known NgRx Store Actions

```typescript
export const ticketActions = createActionGroup({
  source: 'tickets',
  events: {
    'flights load': props<FlightFilter>(),
    'flights loaded': props<{ flights: Flight[] }>(),
    'flights loaded by passenger': props<{ flights: Flight[] }>(),
    'flight update': props<{ flight: Flight }>(),
    'flights clear': emptyProps()
  }
});
```

### Map Actions to Methods

```typescript
export const { provideFlightStore, injectFlightStore } =
  createReduxState('flight', FlightStore, store => withActionMappers(
    mapAction(
      // Filtered Action
      ticketActions.flightsLoad,
      // Side-Effect
      store.loadFlights,
      // Result Action
      ticketActions.flightsLoaded),
    mapAction(
      // Filtered Actions
      ticketActions.flightsLoaded, ticketActions.flightsLoadedByPassenger,
      // State Updater Method (like Reducers)
      store.setFlights
    ),
    mapAction(ticketActions.flightUpdate, store.updateFlight),
    mapAction(ticketActions.flightsClear, store.clearFlights),
  )
);
```

### Register an Angular Dependency Injection Provider

```typescript
export const appRoutes: Route[] = [
  {
    path: 'flight-search-redux-connector',
    providers: [provideFlightStore()],
    component: FlightSearchReducConnectorComponent
  },
];
```

### Use the Store in your Component

```typescript
@Component({
  standalone: true,
  imports: [
    JsonPipe,
    RouterLink,
    FormsModule,
    FlightCardComponent
  ],
  selector: 'demo-flight-search-redux-connector',
  templateUrl: './flight-search.component.html',
})
export class FlightSearchReducConnectorComponent {
  private store = injectFlightStore();

  protected flights = this.store.flightEntities;

  protected search() {
    this.store.dispatch(
      ticketActions.flightsLoad({
        from: this.localState.filter.from(),
        to: this.localState.filter.to()
      })
    );
  }

  protected reset(): void {
    this.store.dispatch(ticketActions.flightsClear());
  }
}
```
## FAQ

### Why is the version range to the `@ngrx/signals` dependency so strict?

The strict version range for @ngrx/signals is necessary because some of our features rely on encapsulated types, which can change even in a patch release.

To ensure stability, we clone these internal types and run integration tests for each release. This rigorous testing means we may need to update our version, even for a patch release, to maintain compatibility and stability.

### I have an idea for a new extension, can I contribute?

Yes, please! We are always looking for new ideas and contributions.

Since we don't want to bloat the library, we are very selective about new features. You also have to provide the following:
- Good test coverage so that we can update it properly and don't have to call you 😉.
- A use case showing the feature in action in the demo app of the repository.
- An entry to the README.md.

This project uses [pnpm](https://pnpm.io/) to manage dependencies and run tasks (for local development and CI).

### I require a feature that is not available in a lower version. What should I do?

Please create an issue. Very likely, we are able to cherry-pick the feature into the lower version.

