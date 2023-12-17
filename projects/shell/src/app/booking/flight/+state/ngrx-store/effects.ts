import { map, switchMap } from 'rxjs';
import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { FlightService } from "../../logic/data-access/flight.service";
import { ticketActions } from "../actions";

@Injectable({
  providedIn: 'root'
})
export class TicketEffects {
  private actions$ = inject(Actions);
  private flightService = inject(FlightService);

  loadFlights = createEffect(
    /**
     * Stream 1: Dispatched Actions
     *  - Trigger
     *  - State Provider: Action - from, to
     */
    () => this.actions$.pipe(
      // Filtering
      ofType(ticketActions.flightsLoad),
      /**
       * Stream 2: API Backend Call
       *  - State Provider: Array of Flight
       */
      switchMap(action => this.flightService.find(
        action.from,
        action.to
      )),
      // Transformation: Flight Array -> Action Flights loaded
      map(flights => ticketActions.flightsLoaded({ flights }))
    )
  );

}
