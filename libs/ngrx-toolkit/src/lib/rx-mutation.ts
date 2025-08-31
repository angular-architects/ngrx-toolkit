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

import { concatOp, FlatteningOperator } from './flattening-operator';
import { Mutation, MutationResult, MutationStatus } from './with-mutations';

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
 * ```typescript
 * export type Params = {
 *   value: number;
 * };
 *
 * export const CounterStore = signalStore(
 *   { providedIn: 'root' },
 *   withState({ counter: 0 }),
 *   withMutations((store) => ({
 *     increment: rxMutation({
 *       operation: (params: Params) => {
 *         return calcSum(store.counter(), params.value);
 *       },
 *       operator: concatOp,
 *       onSuccess: (result) => {
 *         console.log('result', result);
 *         patchState(store, { counter: result });
 *       },
 *       onError: (error) => {
 *         console.error('Error occurred:', error);
 *       },
 *     }),
 *   })),
 * );
 *
 * function calcSum(a: number, b: number): Observable<number> {
 *   return of(a + b);
 * }
 * ```
 *
 * @param options
 * @returns
 */
export function rxMutation<P, R>(
  options: RxMutationOptions<P, R>,
): Mutation<P, R> {
  const inputSubject = new Subject<{
    param: P;
    resolve: (result: MutationResult<R>) => void;
  }>();
  const flatteningOp = options.operator ?? concatOp;

  const destroyRef = options.injector?.get(DestroyRef) ?? inject(DestroyRef);

  const callCount = signal(0);
  const errorSignal = signal<unknown>(undefined);
  const idle = signal(true);
  const isPending = computed(() => callCount() > 0);

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
  let lastResult: R;

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
              lastResult = result;
            }),
            catchError((error: unknown) => {
              options.onError?.(error, input.param);
              errorSignal.set(error);
              innerStatus = 'error';
              return EMPTY;
            }),
            finalize(() => {
              callCount.update((c) => c - 1);

              if (innerStatus === 'success') {
                input.resolve({
                  status: 'success',
                  value: lastResult,
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

  return mutation;
}
