import { signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import { EntityId } from '@ngrx/signals/entities';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { withCallState } from './with-call-state';
import { DataService, withDataService } from './with-data-service';

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
});

export type FlightFilter = {
  from: string;
  to: string;
};

@Injectable({
  providedIn: 'root',
})
export class MockFlightService implements DataService<Flight, FlightFilter> {
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
    throw new Error('updateAll method not implemented.');
  }

  delete(entity: Flight): Promise<void> {
    return firstValueFrom(this.remove(entity));
  }

  load(filter: FlightFilter): Promise<Flight[]> {
    return firstValueFrom(this.find(filter.from, filter.to));
  }

  private find(from: string, to: string, urgent = false): Observable<Flight[]> {
    console.log('hey', from, to);
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
    return of();
  }
}

export type Flight = {
  id: number;
  from: string;
  to: string;
  date: string;
  delayed: boolean;
};
