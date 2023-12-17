import { createFeature, createReducer, createSelector, on } from "@ngrx/store";
import { ticketActions } from "../actions";
import { initialTicketState } from "../model";


export const ticketFeature = createFeature({
  name: 'tickets',
  reducer: createReducer(
    initialTicketState,

    on(ticketActions.flightsLoaded, (state, action) => ({
      ...state,
        flights: action.flights
    })),

    on(ticketActions.flightUpdate, (state, action) => {
      const updated = action.flight;
      const flights = state.flights.map((f) =>
        f.id === updated.id ? updated : f
      );

      return {
        ...state,
        flights,
      };
    }),
  ),
  extraSelectors: ({ selectFlights, selectHide }) => ({
    selectFilteredFlights: createSelector(
      // Selectors
      selectFlights,
      selectHide,
      // Projector
      (flights, hide) => flights.filter(
        flight => !hide.includes(flight.id)
      )
    )
  })
});
