import { Routes } from "@angular/router";
import { provideTicketStore } from "./+state/ngrx-signals/tickets.signal.store";
import { FlightBookingComponent } from "./features/flight-booking/flight-booking.component";
import { FlightEditComponent } from "./features/flight-edit/flight-edit.component";
import { FlightSearchComponent } from "./features/flight-search/flight-search.component";
import { FlightTypeaheadComponent } from "./features/flight-typeahead/flight-typeahead.component";
import { flightsResolverConfig } from "./logic/data-access/flight.resolver";
import { isDevMode } from "@angular/core";


export const FLIGHT_ROUTES: Routes = [
  {
    path: '',
    component: FlightBookingComponent,
    providers: [
      // provideState(ticketFeature),
      // provideEffects([TicketEffects]),
      provideTicketStore(isDevMode())
    ],
    children: [
      {
        path: '',
        redirectTo: 'search',
        pathMatch: 'full'
      },
      {
        path: 'search',
        component: FlightSearchComponent,
      },
      {
        path: 'edit/:id',
        component: FlightEditComponent,
        resolve: flightsResolverConfig
      },
      {
        path: 'typeahead',
        component: FlightTypeaheadComponent,
      },
    ]
  }
];

export default FLIGHT_ROUTES;
