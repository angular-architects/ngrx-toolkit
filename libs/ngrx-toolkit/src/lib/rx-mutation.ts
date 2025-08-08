import { Injector } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  concatMap,
  Observable,
  ObservableInput,
  ObservedValueOf,
  of,
  OperatorFunction,
  Subject,
  tap,
} from 'rxjs';
import { MutationResult } from './with-mutations';

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
): Func<P, Promise<MutationResult>> {
  const mutationSubject = new Subject<P>();
  const flatten = options.operator ?? concatMap;

  // TODO: Use injector

  mutationSubject
    .pipe(
      flatten((param: P) =>
        options.operation(param).pipe(
          tap((result: R) => {
            options.onSuccess?.(result, param);
            // TODO: Decrease counter
          }),
          catchError((error: unknown) => {
            const mutationError =
              options.onError?.(error, param) ?? error ?? 'Mutation failed';
            // TODO: Decrease counter
            // TODO: Set mutationError
            console.error('mutation error', mutationError);
            return of(null);
          }),
        ),
      ),
      takeUntilDestroyed(),
    )
    .subscribe();

  return (param: P) => {
    return new Promise<MutationResult>((resolve) => {
      // TODO: Increase Counter
      mutationSubject.next(param);

      // TODO: resolve promise when done
      resolve({
        status: 'success',
      });
    });
  };
}
