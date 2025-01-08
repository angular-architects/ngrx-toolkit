import { StateSource } from '@ngrx/signals';
import { DevtoolsInnerOptions } from './devtools-feature';

export type Action = { type: string };
export type Connection = {
  send: (action: Action, state: Record<string, unknown>) => void;
};
export type ReduxDevtoolsExtension = {
  connect: (options: { name: string }) => Connection;
};

export type StoreRegistry = Record<
  string,
  {
    options: DevtoolsInnerOptions;
    name: string;
  }
>;

export type Tracker = {
  track(id: string, store: StateSource<object>): void;
  onChange(callback: (changedState: Record<string, object>) => void): void;
  notifyRenamedStore(id: string): void;
  removeStore(id: string): void;
  get stores(): TrackerStores;
};

export type TrackerStores = Record<string, StateSource<object>>;
