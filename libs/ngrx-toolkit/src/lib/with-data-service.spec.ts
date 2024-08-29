import { Injectable } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';
import { signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { EntityId } from '@ngrx/signals/entities';
import { withCallState } from './with-call-state';
import { DataService, withDataService } from './with-data-service';

// Since the resulting shape of entities in the store is a matter of the implementing services of `dataServiceType`,
//     these tests are more so about verifying that each resulting method exists, with or without prefixes.
// The expectations on the resulting shape of the data in the store following these tests merely asserts
//     that the store was patched in the right generic shape and with respective call states.
describe('withDataService', () => {
  it('should load from a service and set entities in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        { providedIn: 'root' },
        withCallState(),
        withEntities<Flight>(),
        withDataService({
          dataServiceType: MockFlightService,
          filter: { from: 'Paris', to: 'New York' },
        })
      );
      const store = new Store();

      tick(1);
      expect(store.entities().length).toBe(0);

      store.load();
      tick(1);

      expect(store.entities().length).toBe(1);
    });
  }));
  it('should load by ID from a service and set entities in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        { providedIn: 'root' },
        withCallState(),
        withEntities<Flight>(),
        withDataService({
          dataServiceType: MockFlightService,
          filter: { from: 'Paris', to: 'New York' },
        })
      );
      const store = new Store();

      tick(1);

      store.loadById(2);

      tick(1);

      expect(store.current()).toEqual({
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
      const Store = signalStore(
        { providedIn: 'root' },
        withCallState(),
        withEntities<Flight>(),
        withDataService({
          dataServiceType: MockFlightService,
          filter: { from: 'Paris', to: 'New York' },
        })
      );
      const store = new Store();

      tick(1);

      expect(store.entities().length).toBe(0)

      store.create({
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      } as Flight)

      tick(1);

      expect(store.entities().length).toBe(1)
      expect(store.current()).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
    });
  }));
  it('should update from a service and update an entity in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        { providedIn: 'root' },
        withCallState(),
        withEntities<Flight>(),
        withDataService({
          dataServiceType: MockFlightService,
          filter: { from: 'Paris', to: 'New York' },
        })
      );
      const store = new Store();

      tick(1);

      expect(store.entities().length).toBe(0)

      store.create({
        id: 3,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
      tick(1);
      store.update({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
      tick(1);

      expect(store.current()).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
    });
  }));
  it('should update all from a service and update all entities in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        { providedIn: 'root' },
        withCallState(),
        withEntities<Flight>(),
        withDataService({
          dataServiceType: MockFlightService,
          filter: { from: 'Paris', to: 'New York' },
        })
      );
      const store = new Store();

      tick(1);

      expect(store.entities().length).toBe(0)

      store.create({
        id: 3,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
      store.create({
        id: 4,
        from: 'Wadena MN',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
      tick(1);
      store.updateAll([{
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      }, {
        id: 4,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      }])
      tick(1);
      expect(store.entities().length).toBe(2)
      expect(store.entities().at(0)).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
      expect(store.entities().at(1)).toEqual({
        id: 4,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
    });
  }));
  it('should delete from a service and update that entity in the store', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        { providedIn: 'root' },
        withCallState(),
        withEntities<Flight>(),
        withDataService({
          dataServiceType: MockFlightService,
          filter: { from: 'Paris', to: 'New York' },
        })
      );
      const store = new Store();

      tick(1);

      expect(store.entities().length).toBe(0)

      store.create({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
      tick(1);
      expect(store.entities().length).toBe(1)
      expect(store.entities().at(0)).toEqual({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
      store.delete({
        id: 3,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      })
      tick(1);
      expect(store.entities().length).toBe(0)
    });
  }));
});

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
    return firstValueFrom(of([{
      id: 3,
      from: 'Paris',
      to: 'New York',
      date: new Date().toDateString(),
      delayed: false,
    }, {
      id: 4,
      from: 'Paris',
      to: 'New York',
      date: new Date().toDateString(),
      delayed: false,
    }]));
  }

  delete(entity: Flight): Promise<void> {
    return firstValueFrom(this.remove(entity));
  }

  load(filter: FlightFilter): Promise<Flight[]> {
    return firstValueFrom(this.find(filter.from, filter.to));
  }

  private find(from: string, to: string, urgent = false): Observable<Flight[]> {
    return of([
      {
        id: 1,
        from: 'Paris',
        to: 'New York',
        date: new Date().toDateString(),
        delayed: false,
      },
    ]);
  }

  private findById(id: string): Observable<Flight> {
    return of({
      id: 2,
      from: 'Paris',
      to: 'New York',
      date: new Date().toDateString(),
      delayed: false,
    });
  }

  private save(flight: Flight): Observable<Flight> {
    return of({
      id: 3,
      from: 'Paris',
      to: 'New York',
      date: new Date().toDateString(),
      delayed: false,
    });
  }

  private remove(flight: Flight): Observable<void> {
    return of(undefined);
  }
}

type Flight = {
  id: number;
  from: string;
  to: string;
  date: string;
  delayed: boolean;
};
