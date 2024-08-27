import { FlightService, FlightServiceRXJS } from '../shared/flight.service';

import { signalStore } from '@ngrx/signals';

import { withEntities } from '@ngrx/signals/entities';
import {
  withCallState,
  withDataService,
  withUndoRedo,
} from '@angular-architects/ngrx-toolkit';
import { Flight } from '../shared/flight';

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

export const SimpleFlightBookingStoreWithObservables = signalStore(
  { providedIn: 'root' },
  withCallState(),
  withEntities<Flight>(),
  withDataService({
    dataServiceType: FlightServiceRXJS,
    filter: { from: 'Paris', to: 'New York' },
  }),
  withUndoRedo(),
);
