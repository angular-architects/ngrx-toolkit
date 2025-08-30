import { computed, DestroyRef, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  concatMap,
  defer,
  EMPTY,
  finalize,
  Observable,
  ObservableInput,
  ObservedValueOf,
  OperatorFunction,
  Subject,
  tap,
} from 'rxjs';

import { Mutation, MutationResult, MutationStatus } from './with-mutations';

export type Func<P, R> = (params: P) => R;

export type FlatteningOperator = <T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
) => OperatorFunction<T, ObservedValueOf<O>>;

export interface RxMutationOptions<P, R> {
  operation: Func<P, Observable<R>>;
  onSuccess?: (result: R, params: P) => void;
  onError?: (error: unknown, params: P) => void;
  operator?: FlatteningOperator;
  injector?: Injector;
}

export function rxMutation<P, R>(
  options: RxMutationOptions<P, R>,
): Mutation<P> {
  const inputSubject = new Subject<{
    param: P;
    resolve: (result: MutationResult) => void;
  }>();
  const flatten = options.operator ?? concatMap;

  const destroyRef = options.injector?.get(DestroyRef) ?? inject(DestroyRef);

  const callCount = signal(0);
  const errorSignal = signal<unknown>(undefined);
  const idle = signal(true);

  const status = computed<MutationStatus>(() => {
    if (idle()) {
      return 'idle';
    }
    if (callCount() > 0) {
      return 'processing';
    }
    if (errorSignal()) {
      return 'error';
    }
    return 'success';
  });

  const initialTempStatus: MutationStatus = 'idle';
  let tempStatus: MutationStatus = initialTempStatus;

  inputSubject
    .pipe(
      flatten((input) =>
        defer(() => {
          callCount.update((c) => c + 1);
          errorSignal.set(undefined);
          idle.set(false);
          return options.operation(input.param).pipe(
            tap((result: R) => {
              options.onSuccess?.(result, input.param);
              tempStatus = 'success';
            }),
            catchError((error: unknown) => {
              options.onError?.(error, input.param);
              const mutationError = error ?? 'Mutation failed';
              errorSignal.set(mutationError);
              tempStatus = 'error';
              return EMPTY;
            }),
            finalize(() => {
              callCount.update((c) => c - 1);

              if (tempStatus === 'success') {
                errorSignal.set(undefined);
                input.resolve({
                  status: 'success',
                  error: undefined,
                });
              } else if (tempStatus === 'error') {
                input.resolve({
                  status: 'error',
                  error: errorSignal(),
                });
              } else {
                input.resolve({
                  status: 'aborted',
                });
              }

              tempStatus = initialTempStatus;
            }),
          );
        }),
      ),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe();

  const mutationFn = (param: P) => {
    return new Promise<MutationResult>((resolve) => {
      inputSubject.next({
        param,
        resolve,
      });
    });
  };

  const mutation = mutationFn as Mutation<P>;
  mutation.status = status;
  mutation.callCount = callCount;
  mutation.error = errorSignal;

  return mutation;
}
