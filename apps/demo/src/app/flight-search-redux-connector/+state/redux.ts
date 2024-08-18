import { ticketActions } from './actions';
import { FlightStore } from './store';
import {
  createReduxState,
  withActionMappers,
  mapAction,
} from '@angular-architects/ngrx-toolkit/redux-connector';

export const { provideFlightStore, injectFlightStore } =
  /**
   * Redux
   *  - Provider
   *  - Injectable Store
   *  - Action to Method Mapper
   *  - Selector Signals
   *  - Dispatch
   */
  createReduxState('flight', FlightStore, (store) =>
    withActionMappers(
      mapAction(
        ticketActions.flightsLoad,
        store.loadFlights,
        ticketActions.flightsLoaded
      ),
      mapAction(
        ticketActions.flightsLoaded,
        ticketActions.flightsLoadedByPassenger,
        store.setFlights
      ),
      mapAction(ticketActions.flightUpdate, store.updateFlight),
      mapAction(ticketActions.flightsClear, store.clearFlights)
    )
  );
