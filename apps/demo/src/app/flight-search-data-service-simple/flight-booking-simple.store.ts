import { FlightService } from '../shared/flight.service';

import {
  signalStore,
} from '@ngrx/signals';

import { withEntities } from '@ngrx/signals/entities';
import { withCallState, withDataService, withUndoRedo } from 'ngrx-toolkit';
import { Flight } from '../shared/flight';

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