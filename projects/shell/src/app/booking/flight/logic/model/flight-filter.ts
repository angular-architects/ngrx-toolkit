
export type FlightFilter = {
  from: string;
  to: string;
  urgent: boolean;
}

export const initialFlightFilter: FlightFilter = {
  from: '',
  to: '',
  urgent: false
};
