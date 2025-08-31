import { computed, DestroyRef, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  defer,
  EMPTY,
  finalize,
  Observable,
  Subject,
  tap,
} from 'rxjs';

import { concatOp, FlatteningOperator } from '../flattening-operator';
import { Mutation, MutationResult, MutationStatus } from './mutation';

export type Func<P, R> = (params: P) => R;

export interface RxMutationOptions<P, R> {
  operation: Func<P, Observable<R>>;
  onSuccess?: (result: R, params: P) => void;
  onError?: (error: unknown, params: P) => void;
  operator?: FlatteningOperator;
  injector?: Injector;
}

/**
 * Creates a mutation that leverages RxJS.
 *
 * For each mutation the following options can be defined:
 * - `operation`: A function that defines the mutation logic. It returns an Observable.
 * - `onSuccess`: A callback that is called when the mutation is successful.
 * - `onError`: A callback that is called when the mutation fails.
 * - `operator`: An optional wrapper of an RxJS flattening operator. By default `concat` sematics are used.
 * - `injector`: An optional Angular injector to use for dependency injection.
 *
 * The `operation` is the only mandatory option.
 *
 * The returned mutation can be called as an async function and returns a Promise.
 * This promise informs about whether the mutation was successful, failed, or aborted
 * (due to switchMap or exhaustMap semantics).
 *
 * The mutation also provides several Signals such as error, status or isPending (see below).
 *
 * Example usage without Store:
 *
 * ```typescript
 * private counterSignal = signal(0);
 *
 * private increment = rxMutation({
 *   operation: (params: Params) => {
 *     return calcSum(this.counterSignal(), params.value);
 *   },
 *   operator: concatOp,
 *   onSuccess: (result) => {
 *     this.counterSignal.set(result);
 *   },
 *   onError: (error) => {
 *     console.error('Error occurred:', error);
 *   },
 * });
 *
 * protected error = this.increment.error;
 * protected isPending = this.increment.isPending;
 * protected status = this.increment.status;
 * protected value = this.increment.value;
 * protected hasValue = this.increment.hasValue;
 *
 * async incrementCounter() {
 *     const result = await this.increment({ value: 1 });
 *     if (result.status === 'success') {
 *       console.log('Success:', result.value);
 *     }
 *     if (result.status === 'error') {
 *       console.log('Error:', result.error);
 *     }
 *     if (result.status === 'aborted') {
 *       console.log('Operation aborted');
 *     }
 * }
 *
 * function calcSum(a: number, b: number): Observable<number> {
 *   return of(result).pipe(delay(500));
 * }
 * ```
 *
 * @param options
 * @returns
 */
export function rxMutation<P, R>(
  optionsOrOperation: RxMutationOptions<P, R> | Func<P, Observable<R>>,
): Mutation<P, R> {
  const inputSubject = new Subject<{
    param: P;
    resolve: (result: MutationResult<R>) => void;
  }>();

  const options =
    typeof optionsOrOperation === 'function'
      ? { operation: optionsOrOperation }
      : optionsOrOperation;

  const flatteningOp = options.operator ?? concatOp;

  const destroyRef = options.injector?.get(DestroyRef) ?? inject(DestroyRef);

  const callCount = signal(0);
  const errorSignal = signal<unknown>(undefined);
  const idle = signal(true);
  const isPending = computed(() => callCount() > 0);
  const value = signal<R | undefined>(undefined);
  const isFullfilled = computed(
    () => !idle() && !isPending() && !errorSignal(),
  );

  const hasValue = function (
    this: Mutation<P, R>,
  ): this is Mutation<Exclude<P, undefined>, R> {
    return typeof value() !== 'undefined';
  };

  const status = computed<MutationStatus>(() => {
    if (idle()) {
      return 'idle';
    }
    if (callCount() > 0) {
      return 'pending';
    }
    if (errorSignal()) {
      return 'error';
    }
    return 'success';
  });

  const initialInnerStatus: MutationStatus = 'idle';
  let innerStatus: MutationStatus = initialInnerStatus;

  inputSubject
    .pipe(
      flatteningOp.rxJsOperator((input) =>
        defer(() => {
          callCount.update((c) => c + 1);
          idle.set(false);
          return options.operation(input.param).pipe(
            tap((result: R) => {
              options.onSuccess?.(result, input.param);
              innerStatus = 'success';
              errorSignal.set(undefined);
              value.set(result);
            }),
            catchError((error: unknown) => {
              options.onError?.(error, input.param);
              errorSignal.set(error);
              value.set(undefined);
              innerStatus = 'error';
              return EMPTY;
            }),
            finalize(() => {
              callCount.update((c) => c - 1);

              if (innerStatus === 'success') {
                input.resolve({
                  status: 'success',
                  value: value() as R,
                });
              } else if (innerStatus === 'error') {
                input.resolve({
                  status: 'error',
                  error: errorSignal(),
                });
              } else {
                input.resolve({
                  status: 'aborted',
                });
              }

              innerStatus = initialInnerStatus;
            }),
          );
        }),
      ),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe();

  const mutationFn = (param: P) => {
    return new Promise<MutationResult<R>>((resolve) => {
      if (callCount() > 0 && flatteningOp.exhaustSemantics) {
        resolve({
          status: 'aborted',
        });
      } else {
        inputSubject.next({
          param,
          resolve,
        });
      }
    });
  };

  const mutation = mutationFn as Mutation<P, R>;
  mutation.status = status;
  mutation.isPending = isPending;
  mutation.error = errorSignal;
  mutation.value = value;
  mutation.hasValue = hasValue;
  mutation.isFullfilled = isFullfilled;
  return mutation;
}
