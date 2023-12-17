
export interface Passenger {
    id: number;
    firstName: string,
    name: string;
    bonusMiles: number;
    passengerStatus: string;
}

export const initialPassenger: Passenger = {
  id: 0,
  firstName: '',
  name: '',
  bonusMiles: 0,
  passengerStatus: ''
};
