import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { Flight } from "../logic/model/flight";
import { FlightFilter } from "../logic/model/flight-filter";

export const ticketActions = createActionGroup({
  source: 'tickets',
  events: {
    'flights load': props<FlightFilter>(),
    'flights loaded': props<{ flights: Flight[] }>(),
    'flights loaded by passenger': props<{ flights: Flight[] }>(),
    'flight update': props<{ flight: Flight }>(),
    'flights clear': emptyProps()
  }
});
