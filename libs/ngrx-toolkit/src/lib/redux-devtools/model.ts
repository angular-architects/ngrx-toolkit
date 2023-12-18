import type { patchState as originalPatchState } from '@ngrx/signals';


// eslint-disable-next-line @typescript-eslint/ban-types
export type EmptyFeatureResult = { state: {}; signals: {}; methods: {} };
export type Action = { type: string };

export type ConnectResponse = {
  send: (action: Action, state: unknown) => void;
};

export type PatchFn = typeof originalPatchState extends (
  arg1: infer First,
  ...args: infer Rest
) => infer Returner
  ? (state: First, action: string, ...rest: Rest) => Returner
  : never;

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: {
      connect: (options: { name: string }) => {
        send: (action: Action) => void;
      };
    };
  }
}
