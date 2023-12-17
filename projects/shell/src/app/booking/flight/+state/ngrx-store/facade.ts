import { inject } from "@angular/core"
import { Store } from "@ngrx/store"
import { ticketActions } from "../actions";
import { ticketFeature } from "./reducer";


export function injectTicketsFacade() {
  const store = inject(Store);

  return {
    flights$: store.select(ticketFeature.selectFlights),
    search: (from: string, to: string, urgent = false) => {
      store.dispatch(ticketActions.flightsLoad({ from, to, urgent }))
    }
  };
}
