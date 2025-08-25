import { computed, DestroyRef, inject, Injector } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withState,
  WritableStateSource,
} from '@ngrx/signals';
import {
  catchError,
  concatMap,
  exhaustMap,
  firstValueFrom,
  mergeMap,
  Observable,
  of,
  OperatorFunction,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

//
// CREDITS: This implementation is highly influenced by Marko Stanimirović' prototype:
// https://github.com/markostanimirovic/rx-resource-proto
//
// Big thanks to Marko for sharing his knowledge and for his great work!
//

export interface MutationState {
  _mutationCount: number;
  mutationError: string | null;
}

const incrementCounter = (state: MutationState) => ({
  ...state,
  _mutationCount: state._mutationCount + 1,
});
const decrementCounter = (state: MutationState) => ({
  ...state,
  _mutationCount: state._mutationCount - 1,
});

export const clearMutationError = (state: MutationState) => ({
  ...state,
  mutationError: null,
});

export type FlatteningOperator = 'merge' | 'concat' | 'switch' | 'exhaust';

export interface MutationOptions<P, R> {
  operation: (params: P) => Observable<R>;
  onSuccess?: (params: P, result: R) => void;
  onError?: (params: P, error: unknown) => string | void;
  operator?: FlatteningOperator;
  injector?: Injector;
}

function flatten<P, R>(
  operation: (params: P) => Observable<R>,
  operator: FlatteningOperator,
): OperatorFunction<P, R> {
  switch (operator) {
    case 'concat':
      return concatMap(operation);
    case 'switch':
      return switchMap(operation);
    case 'exhaust':
      return exhaustMap(operation);
    case 'merge':
    default:
      return mergeMap(operation);
  }
}

export function rxMutation<P, R>(
  store: WritableStateSource<MutationState>,
  options: MutationOptions<P, R>,
) {
  const destroyRef = options.injector?.get(DestroyRef) || inject(DestroyRef);
  const mutationSubject = new Subject<P>();

  const successSubject = new Subject<{ params: P; result: R }>();
  const errorSubject = new Subject<{ params: P; error: unknown }>();

  const operator = options.operator || 'merge';
  const flatteningOp = flatten((params: P) => {
    return options.operation(params).pipe(
      tap((result) => {
        options.onSuccess?.(params, result);
        patchState(store, decrementCounter);
        successSubject.next({ params, result });
      }),
      catchError((error) => {
        console.error('Mutation error:', error);
        const mutationError =
          options.onError?.(params, error) ??
          error.message ??
          'Mutation failed';
        patchState(store, mutationError, decrementCounter);
        errorSubject.next({ params, error });
        return of(null);
      }),
    );
  }, operator);

  mutationSubject
    .pipe(flatteningOp, takeUntilDestroyed(destroyRef))
    .subscribe();

  const result = (params: P) => {
    patchState(store, incrementCounter);
    mutationSubject.next(params);
  };

  result.success = successSubject.asObservable();
  result.error = errorSubject.asObservable();

  return result;
}

export function mutation<P, R>(
  store: WritableStateSource<MutationState>,
  options: MutationOptions<P, R>,
): (params: P) => Promise<R> {
  return async (params: P): Promise<R> => {
    patchState(store, incrementCounter);
    try {
      const result = await firstValueFrom(options.operation(params));
      options.onSuccess?.(params, result);
      return result;
    } catch (error) {
      console.error('Mutation error:', error);
      const mutationError =
        options.onError?.(params, error) ??
        (error instanceof Error ? error.message : 'Mutation failed');
      patchState(store, { mutationError });
      throw error;
    } finally {
      patchState(store, decrementCounter);
    }
  };
}

export function withMutations() {
  return signalStoreFeature(
    withState<MutationState>({
      _mutationCount: 0,
      mutationError: null,
    }),
    withComputed((state) => ({
      isProcessing: computed(() => state._mutationCount() > 0),
    })),
  );
}
