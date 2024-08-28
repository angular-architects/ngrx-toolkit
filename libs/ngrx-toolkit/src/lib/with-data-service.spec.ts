import {
  DataService,
  withCallState,
  withDataService,
} from '@angular-architects/ngrx-toolkit';
import { signalStore, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { Flight } from '../../../../apps/demo/src/app/shared/flight';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { EntityId } from '@ngrx/signals/entities';

describe('withDataService', () => {
  it('should load from a service and set entities in the store', () => {
    const Store = signalStore(
      { providedIn: 'root' },
      withCallState(),
      withEntities<Flight>(),
      withDataService({
        dataServiceType: MockFlightService,
        filter: { from: 'Paris', to: 'New York' },
      }),
    );

    const store = new Store();

    expect(store.entities.length).toBe(0);

    store.load()

    expect(store.entities.length).toBe(1);
  });
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
    return of([{id: 1, from: 'Paris', to: 'New York', date: new Date().toDateString(), delayed: false}])
  }

  private findById(id: string): Observable<Flight> {
    return of({id: 2, from: 'Paris', to: 'New York', date: new Date().toDateString(), delayed: false})
  }

  private save(flight: Flight): Observable<Flight> {
    return of({id: 3, from: 'Paris', to: 'New York', date: new Date().toDateString(), delayed: false})
  }

  private remove(flight: Flight): Observable<void> {
    return of()
  }
}
