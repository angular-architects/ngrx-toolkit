import { Flight } from '../../shared/flight';

export type FlightState = {
  flights: Flight[];
  basket: unknown;
  tickets: unknown;
  hide: number[];
};

export const initialTicketState: FlightState = {
  flights: [],
  basket: {},
  tickets: {},
  hide: [3, 5],
};
