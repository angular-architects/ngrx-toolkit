
export type Flight = {
  id: number;
  from: string;
  to: string;
  date: string;
  delayed: boolean;
}

export const initialFlight: Flight = {
  id: 0,
  from: '',
  to: '',
  date: '',
  delayed: false
};
