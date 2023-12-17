import { Flight } from "../logic/model/flight";


export type TicketState = {
  flights: Flight[];
  basket: unknown;
  tickets: unknown;
  hide: number[];
};

export const initialTicketState: TicketState = {
  flights: [],
  basket: {},
  tickets: {},
  hide: [3, 5]
};
