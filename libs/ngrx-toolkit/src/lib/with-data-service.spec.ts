import { Injectable } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable, firstValueFrom, of, delay } from 'rxjs';
import { signalStore, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { EntityId } from '@ngrx/signals/entities';
import { withCallState } from './with-call-state';
import { DataService, withDataService } from './with-data-service';

// Since the resulting shape of entities in the store is a matter of the implementing services of `dataServiceType`,
//     these tests are more so about verifying that each resulting method exists, with or without named collections.
// The expectations on the resulting shape of the data in the store following these tests merely asserts
//     that the store was patched in the right generic shape and with respective call states.

describe('withDataService', () => {
  it('should load from a service and set entities in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();

      tick();
      expect(store.entities().length).toBe(0);

      store.load();
      tick();

      expect(store.entities().length).toBe(1);
    });
  }));
  it('should load from a service and set entities in the store (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();

      tick();
      expect(store.flightEntities().length).toBe(0);

      store.loadFlightEntities();
      tick();

      expect(store.flightEntities().length).toBe(1);
    });
  }));
  it('should load by ID from a service and set entities in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();

      tick();

      store.loadById(2);

      tick();

      expect(store.current()).toEqual({
        id: 2,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should load by ID from a service and set entities in the store (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();

      tick();

      store.loadFlightById(2);

      tick();

      expect(store.currentFlight()).toEqual({
        id: 2,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should create from a service and set an entity in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();

      tick();

      expect(store.entities().length).toBe(0);

      store.create({
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      } as Flight);

      tick();

      expect(store.entities().length).toBe(1);
      expect(store.current()).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should create from a service and set an entity in the store (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();

      tick();

      expect(store.flightEntities().length).toBe(0);

      store.createFlight({
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      } as Flight);

      tick();

      expect(store.flightEntities().length).toBe(1);
      expect(store.currentFlight()).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should update from a service and update an entity in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();

      tick();

      expect(store.entities().length).toBe(0);

      store.create({
        id: 3,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      store.update({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();

      expect(store.current()).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should update from a service and update an entity in the store (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();

      tick();

      expect(store.flightEntities().length).toBe(0);

      store.createFlight({
        id: 3,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      store.updateFlight({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();

      expect(store.currentFlight()).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should update all from a service and update all entities in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();

      tick();

      expect(store.entities().length).toBe(0);

      store.create({
        id: 3,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      store.create({
        id: 4,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      store.updateAll([
        {
          id: 3,
          from: 'Paris',
          to: 'New York',
          date: new Date().toDateString(),
          delayed: false,
        },
        {
          id: 4,
          from: 'Paris',
          to: 'New York',
          date: new Date().toDateString(),
          delayed: false,
        },
      ]);
      tick();
      expect(store.entities().length).toBe(2);
      expect(store.entities().at(0)).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      expect(store.entities().at(1)).toEqual({
        id: 4,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should update all from a service and update all entities in the store (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();

      tick();

      expect(store.flightEntities().length).toBe(0);

      store.createFlight({
        id: 3,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      store.createFlight({
        id: 4,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      store.updateAllFlight([
        {
          id: 3,
          from: 'Paris',
          to: 'New York',
          date: new Date().toDateString(),
          delayed: false,
        },
        {
          id: 4,
          from: 'Paris',
          to: 'New York',
          date: new Date().toDateString(),
          delayed: false,
        },
      ]);
      tick();
      expect(store.flightEntities().length).toBe(2);
      expect(store.flightEntities().at(0)).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      expect(store.flightEntities().at(1)).toEqual({
        id: 4,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should delete from a service and update that entity in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();

      tick();

      expect(store.entities().length).toBe(0);

      store.create({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      expect(store.entities().length).toBe(1);
      expect(store.entities().at(0)).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      store.delete({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      expect(store.entities().length).toBe(0);
    });
  }));
  it('should delete from a service and update that entity in the store (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();

      tick();

      expect(store.flightEntities().length).toBe(0);

      store.createFlight({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      expect(store.flightEntities().length).toBe(1);
      expect(store.flightEntities().at(0)).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      store.deleteFlight({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      expect(store.flightEntities().length).toBe(0);
    });
  }));
  it('should update the selected flight of the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();

      tick();

      store.create({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      expect(store.selectedEntities().length).toBe(0);

      store.updateSelected(3, true);

      tick();

      expect(store.selectedEntities().length).toBe(1);
      expect(store.selectedEntities()).toContainEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should update selected flight of the store (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();

      tick();

      store.createFlight({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      expect(store.selectedFlightEntities().length).toBe(0);

      store.updateSelectedFlightEntities(3, true);

      tick();

      expect(store.selectedFlightEntities().length).toBe(1);
      expect(store.selectedFlightEntities()).toContainEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('should update the filter of the service', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();

      tick();

      expect(store.filter()).toEqual({ from: 'Paris', to: 'New York' });

      store.updateFilter({ from: 'Wadena MN', to: 'New York' });

      tick();

      expect(store.filter()).toEqual({ from: 'Wadena MN', to: 'New York' });
    });
  }));
  it('should update the filter of the service (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();

      tick();

      expect(store.flightFilter()).toEqual({ from: 'Paris', to: 'New York' });

      store.updateFlightFilter({ from: 'Wadena MN', to: 'New York' });

      tick();

      expect(store.flightFilter()).toEqual({
        from: 'Wadena MN',
        to: 'New York',
      });
    });
  }));
  it('should the current entity', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new Store();
      tick();

      store.create({
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      } as Flight);

      store.setCurrent({
        id: 4,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });

      expect(store.current()).toEqual({
        id: 4,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));
  it('set the current entity (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollection();
      tick();

      store.createFlight({
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      } as Flight);

      store.setCurrentFlight({
        id: 4,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });

      expect(store.currentFlight()).toEqual({
        id: 4,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
    });
  }));

  it('handles loading state', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreForLoading();
      tick();

      expect(store.loading()).toBe(false);

      store.create({
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      } as Flight);
      tick();
      expect(store.loading()).toBe(true);
      tick(3);
      expect(store.loading()).toBe(false);

      store.load();
      tick();
      expect(store.loading()).toBe(true);
      tick(3);
      expect(store.loading()).toBe(false);

      store.loadById(3);
      tick();
      expect(store.loading()).toBe(true);
      tick(3);
      expect(store.loading()).toBe(false);

      store.update({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      expect(store.loading()).toBe(true);
      tick(3);
      expect(store.loading()).toBe(false);

      store.updateAll([
        {
          id: 3,
          from: 'Paris',
          to: 'New York',
          date: new Date().toDateString(),
          delayed: false,
        },
        {
          id: 4,
          from: 'Paris',
          to: 'New York',
          date: new Date().toDateString(),
          delayed: false,
        },
      ]);
      tick();
      expect(store.loading()).toBe(true);
      tick(3);
      expect(store.loading()).toBe(false);

      store.delete({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      expect(store.loading()).toBe(true);
      tick(3);
      expect(store.loading()).toBe(false);
    });
  }));

  it('handles loading state (with named collection)', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const store = new StoreWithNamedCollectionForLoading();
      tick();

      expect(store.flightLoading()).toBe(false);

      store.createFlight({
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      } as Flight);
      tick();
      expect(store.flightLoading()).toBe(true);
      tick(3);
      expect(store.flightLoading()).toBe(false);

      store.loadFlightEntities();
      tick();
      expect(store.flightLoading()).toBe(true);
      tick(3);
      expect(store.flightLoading()).toBe(false);

      store.loadFlightById(3);
      tick();
      expect(store.flightLoading()).toBe(true);
      tick(3);
      expect(store.flightLoading()).toBe(false);

      store.updateFlight({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      expect(store.flightLoading()).toBe(true);
      tick(3);
      expect(store.flightLoading()).toBe(false);

      store.updateAllFlight([
        {
          id: 3,
          from: 'Paris',
          to: 'New York',
          date: new Date().toDateString(),
          delayed: false,
        },
        {
          id: 4,
          from: 'Paris',
          to: 'New York',
          date: new Date().toDateString(),
          delayed: false,
        },
      ]);
      tick();
      expect(store.flightLoading()).toBe(true);
      tick(3);
      expect(store.flightLoading()).toBe(false);

      store.deleteFlight({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      });
      tick();
      expect(store.flightLoading()).toBe(true);
      tick(3);
      expect(store.flightLoading()).toBe(false);
    });
  }));

  // TODO 3A: setting error state (without named collection)
  // TODO 3B: setting error state (with named collection)
});

// Test helpers
let currentFlightId = 0;
const createFlight = (flight: Partial<Flight> = {}) => ({
  ...{
    id: ++currentFlightId, from: 'Paris', to: 'New York', date: new Date().toDateString(), delayed: false,
  },
  ...flight
});
type Flight = {
  id: number;
  from: string;
  to: string;
  date: string;
  delayed: boolean;
};

type FlightFilter = {
  from: string;
  to: string;
};

@Injectable({
  providedIn: 'root',
})
class MockFlightService implements DataService<Flight, FlightFilter> {
  loadById(id: EntityId): Promise<Flight> {
    return firstValueFrom(this.findById('' + id));
  }

  create(entity: Flight): Promise<Flight> {
    entity.id = 0;
    return firstValueFrom(this.save(entity));
  }

  update(entity: Flight): Promise<Flight> {
    return firstValueFrom(this.save(entity));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateAll(entity: Flight[]): Promise<Flight[]> {
    return firstValueFrom(
      of([createFlight({id: 3}), createFlight({id: 4})])
    );
  }

  delete(entity: Flight): Promise<void> {
    return firstValueFrom(this.remove(entity));
  }

  load(filter: FlightFilter): Promise<Flight[]> {
    return firstValueFrom(this.find(filter.from, filter.to));
  }

  private find(from: string, to: string, urgent = false): Observable<Flight[]> {
    return of([createFlight()]);
  }

  private findById(id: string): Observable<Flight> {
    return of(createFlight({id: 2}));
  }

  private save(flight: Flight): Observable<Flight> {
    return of(createFlight({id: 3}));
  }

  private remove(flight: Flight): Observable<void> {
    return of(undefined);
  }
}

@Injectable({
  providedIn: 'root',
})
class MockFlightServiceForLoading implements DataService<Flight, FlightFilter> {
  loadById(id: EntityId): Promise<Flight> {
    return firstValueFrom(this.findById('' + id));
  }

  create(entity: Flight): Promise<Flight> {
    entity.id = 0;
    return firstValueFrom(this.save(entity));
  }

  update(entity: Flight): Promise<Flight> {
    return firstValueFrom(this.save(entity));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateAll(entity: Flight[]): Promise<Flight[]> {
    return firstValueFrom(
      of([createFlight({id: 3}), createFlight({id: 4})]).pipe(delay(3))
    );
  }

  delete(entity: Flight): Promise<void> {
    return firstValueFrom(this.remove(entity));
  }

  load(filter: FlightFilter): Promise<Flight[]> {
    return firstValueFrom(this.find(filter.from, filter.to));
  }

  private find(from: string, to: string, urgent = false): Observable<Flight[]> {
    return of([createFlight({id: 1})]).pipe(delay(3));
  }

  private findById(id: string): Observable<Flight> {
    return of(createFlight({id: 2})).pipe(delay(3));
  }

  private save(flight: Flight): Observable<Flight> {
    return of(createFlight({id: 3})).pipe(delay(3));
  }

  private remove(flight: Flight): Observable<void> {
    return of(undefined).pipe(delay(3));
  }
}

const Store = signalStore(
  withCallState(),
  withEntities<Flight>(),
  withDataService({
    dataServiceType: MockFlightService,
    filter: { from: 'Paris', to: 'New York' },
  })
);
const StoreWithNamedCollection = signalStore(
  withCallState({
    collection: 'flight',
  }),
  withEntities({
    entity: type<Flight>(),
    collection: 'flight',
  }),
  withDataService({
    dataServiceType: MockFlightService,
    filter: { from: 'Paris', to: 'New York' },
    collection: 'flight',
  })
);

const StoreForLoading = signalStore(
  withCallState(),
  withEntities<Flight>(),
  withDataService({
    dataServiceType: MockFlightServiceForLoading,
    filter: { from: 'Paris', to: 'New York' },
  })
);
const StoreWithNamedCollectionForLoading = signalStore(
  withCallState({
    collection: 'flight',
  }),
  withEntities({
    entity: type<Flight>(),
    collection: 'flight',
  }),
  withDataService({
    dataServiceType: MockFlightServiceForLoading,
    filter: { from: 'Paris', to: 'New York' },
    collection: 'flight',
  })
);
