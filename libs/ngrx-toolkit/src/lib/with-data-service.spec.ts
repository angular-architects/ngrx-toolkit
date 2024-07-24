import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signalStore, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { DataService, withDataService } from './with-data-service';
import { withCallState } from './with-call-state';

type Flight = {
  flightId: number;
  from: string;
  to: string;
  delayed: boolean;
};

export type Filter = {
  from?: string;
  to?: string;
};

@Injectable({
  providedIn: 'root',
})
class FlightService implements DataService<Flight, Filter> {
  private flight1: Flight = {
    flightId: 1,
    from: 'Paris',
    to: 'New York',
    delayed: false,
  };
  private flight2: Flight = {
    flightId: 2,
    from: 'Paris',
    to: 'London',
    delayed: false,
  };

  private flights: Flight[] = [this.flight1, this.flight2];

  async load(filter: Filter): Promise<Flight[]> {
    return this.flights.filter(
      (flight) =>
        (!filter.from || flight.from === filter.from) &&
        (!filter.to || flight.to === filter.to)
    );
  }

  async loadById(id: number): Promise<Flight> {
    const flight = this.flights.find((flight) => flight.flightId === id);
    if (!flight) {
      throw new Error('Flight not found');
    }
    return flight;
  }

  async create(flight: Flight): Promise<Flight> {
    this.flights.push(flight);
    return flight;
  }

  async update(flight: Flight): Promise<Flight> {
    const index = this.flights.findIndex((f) => f.flightId === flight.flightId);
    if (index === -1) {
      throw new Error('Flight not found');
    }
    this.flights[index] = flight;
    return flight;
  }

  async updateAll(flights: Flight[]): Promise<Flight[]> {
    this.flights = flights;
    return flights;
  }

  async delete(flight: Flight): Promise<void> {
    this.flights = this.flights.filter((f) => f.flightId !== flight.flightId);
  }
}

describe('FlightDataStore', () => {
  it('should load flights based on filter', async () => {
    const FlightStore = signalStore(
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
        filter: { to: 'New York' },
        collection: 'flight',
        selectId: (flight: Flight) => flight?.flightId,
      })
    );

    const store = TestBed.configureTestingModule({
      providers: [FlightStore],
    }).inject(FlightStore);

    await store.loadFlightEntities();

    const flight1: Flight = {
      flightId: 1,
      from: 'Paris',
      to: 'New York',
      delayed: false,
    };

    expect(store.flightEntities()).toEqual([flight1]);
  });

  it('should load a flight by ID', async () => {
    const FlightStore = signalStore(
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
        filter: {},
        collection: 'flight',
        selectId: (flight: Flight) => flight?.flightId,
      })
    );

    const store = TestBed.configureTestingModule({
      providers: [FlightStore],
    }).inject(FlightStore);

    const flight1: Flight = {
      flightId: 1,
      from: 'Paris',
      to: 'New York',
      delayed: false,
    };

    await store.loadFlightById(1);
    expect(store.currentFlight()).toEqual(flight1);
  });
});
