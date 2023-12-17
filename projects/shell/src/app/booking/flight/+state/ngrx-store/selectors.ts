import { ticketFeature } from './reducer';
import { createSelector } from "@ngrx/store";

export const selectFilteredFlights = createSelector(
  // Selectors
  ticketFeature.selectFlights,
  ticketFeature.selectHide,
  // Projector
  (flights, hide) => flights.filter(
    flight => !hide.includes(flight.id)
  )
);
