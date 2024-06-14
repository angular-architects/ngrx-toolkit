import { FlightService } from '../shared/flight.service';

import { signalStore, type } from '@ngrx/signals';

import { withEntities } from '@ngrx/signals/entities';
import { withCallState, withDataService, withPagination } from 'ngrx-toolkit';
import { Flight } from '../shared/flight';

export const FlightBookingStore = signalStore(
  withCallState({
    collection: 'flight',
  }),
  withEntities({
    entity: type<Flight>(),
    collection: 'flight',
  }),
  withDataService({
    dataServiceType: FlightService,
    filter: { from: 'Wien', to: '' },
    collection: 'flight',
  }),
  withPagination({
    entity: type<Flight>(),
    collection: 'flight',
  })
);
