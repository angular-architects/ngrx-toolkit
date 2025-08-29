import { DestroyRef, inject, Injector, signal } from '@angular/core';
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

  const destroyRef = options.injector?.get(DestroyRef) ?? inject(DestroyRef);

  const status = signal<MutationStatus>('idle');
  const callCount = signal(0);
  const errorSignal = signal<unknown>(undefined);

  let internalStatus = status();

  inputSubject
    .pipe(
      flatten((input) =>
        options.operation(input.param).pipe(
          tap((result: R) => {
            options.onSuccess?.(result, input.param);
            internalStatus = 'success';
          }),
          catchError((error: unknown) => {
            options.onError?.(error, input.param);
            const mutationError = error ?? 'Mutation failed';
            errorSignal.set(mutationError);
            internalStatus = 'error';

            return of(null);
          }),
          finalize(() => {
            callCount.update((c) => c - 1);

            if (callCount() > 0) {
              // Another call took over (e.g. because of using switchMap)
              input.resolve({
                status: 'aborted',
              });
            } else if (internalStatus === 'processing') {
              // Completion without emitting a value
              input.resolve({
                status: 'aborted',
              });
            } else if (
              internalStatus === 'error' ||
              internalStatus === 'success'
            ) {
              status.set(internalStatus);
              input.resolve({
                status: internalStatus,
                error: internalStatus === 'error' ? errorSignal() : undefined,
              });
            } else {
              throw new Error('Unexpected mutation status ' + internalStatus);
            }
          }),
        ),
      ),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe();

  const mutationFn = (param: P) => {
    return new Promise<MutationResult>((resolve) => {
      // TODO: Do we find a better way for solving this?
      if (options.operator?.name === 'exhaustMap' && callCount() > 0) {
        resolve({ status: 'aborted' });
        return;
      }

      callCount.update((c) => c + 1);
      status.set('processing');
      errorSignal.set(undefined);
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
