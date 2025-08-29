import { Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  concatMap,
  finalize,
  Observable,
  ObservableInput,
  ObservedValueOf,
  of,
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

  // TODO: Use injector

  const status = signal<MutationStatus>('idle');
  const callCount = signal(0);
  const errorSignal = signal<unknown>(undefined);

  inputSubject
    .pipe(
      flatten((input) =>
        options.operation(input.param).pipe(
          tap((result: R) => {
            options.onSuccess?.(result, input.param);
            status.set('success');
            input.resolve({
              status: 'success',
            });
          }),
          catchError((error: unknown) => {
            options.onError?.(error, input.param);
            const mutationError = error ?? 'Mutation failed';
            errorSignal.set(mutationError);
            status.set('error');
            input.resolve({
              status: 'error',
              error: mutationError,
            });
            return of(null);
          }),
          finalize(() => {
            callCount.update((c) => c - 1);
            if (status() === 'processing') {
              input.resolve({
                status: 'aborted',
              });
            }
          }),
        ),
      ),
      takeUntilDestroyed(),
    )
    .subscribe();

  const mutationFn = (param: P) => {
    return new Promise<MutationResult>((resolve) => {
      callCount.update((c) => c + 1);
      status.set('processing');
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
