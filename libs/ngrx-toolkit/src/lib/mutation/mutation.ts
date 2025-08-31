import { Signal } from '@angular/core';

export type MutationResult<T> =
  | {
      status: 'success';
      value: T;
    }
  | {
      status: 'error';
      error: unknown;
    }
  | {
      status: 'aborted';
    };

export type MutationStatus = 'idle' | 'pending' | 'error' | 'success';

export type Mutation<P, R> = {
  (params: P): Promise<MutationResult<R>>;
  status: Signal<MutationStatus>;
  value: Signal<R | undefined>;
  isPending: Signal<boolean>;
  isFullfilled: Signal<boolean>;
  error: Signal<unknown>;
  hasValue(): this is Mutation<Exclude<P, undefined>, R>;
};
