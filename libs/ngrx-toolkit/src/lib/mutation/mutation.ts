import { Signal } from '@angular/core';

export type MutationResult<Result> =
  | {
      status: 'success';
      value: Result;
    }
  | {
      status: 'error';
      error: unknown;
    }
  | {
      status: 'aborted';
    };

export type MutationStatus = 'idle' | 'pending' | 'error' | 'success';

export type Mutation<Parameter, Result> = {
  (params: Parameter): Promise<MutationResult<Result>>;
  status: Signal<MutationStatus>;
  value: Signal<Result | undefined>;
  isPending: Signal<boolean>;
  isSuccess: Signal<boolean>;
  error: Signal<unknown>;
  hasValue(): this is Mutation<Exclude<Parameter, undefined>, Result>;
};
