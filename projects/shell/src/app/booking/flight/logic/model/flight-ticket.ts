
export type FlightTicket = {
  id: number;
  flightId: number;
  passengerId: number;
  price: number;
}

export const intialFlightTicket: FlightTicket = {
  id: 0,
  flightId: 0,
  passengerId: 0,
  price: 0
};
