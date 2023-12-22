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
  withUndoRedo(),
);
```

The features ``withCallState`` and ``withUndoRedo`` are optional, but when present, they enrich each other.

The Data Service needs to implement the ``DataService`` interface:

```typescript 
@Injectable({
  providedIn: 'root'
})
export class FlightService implements DataService<Flight, FlightFilter> {
  loadById(id: EntityId): Promise<Flight> { ... }
  load(filter: FlightFilter): Promise<Flight[]> { ... }

  create(entity: Flight): Promise<Flight> { ... }
  update(entity: Flight): Promise<Flight> { ... }
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

To avoid naming conflicts, the properties set up by ``withDataService`` and the connected features can be configured in a typesafe way:

```typescript
export const FlightBookingStore = signalStore(
  { providedIn: 'root' },
  withCallState({
    collection: 'flight'
  }),
  withEntities({ 
    entity: type<Flight>(), 
    collection: 'flight'
  }),
  withDataService({
    dataServiceType: FlightService, 
    filter: { from: 'Graz', to: 'Hamburg' },
    collection: 'flight'
  }),
  withUndoRedo({
    collections: ['flight'],
  }),
);
```

This setup makes them use ``flight`` as part of the used property names. As these implementations respect the Type Script type system, the compiler will make sure these properties are used in a typesafe way:

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