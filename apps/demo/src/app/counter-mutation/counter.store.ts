import {
  concatOp,
  rxMutation,
  withMutations,
} from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withState } from '@ngrx/signals';
import { delay, Observable } from 'rxjs';

export type Params = {
  value: number;
};

export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ counter: 0 }),
  withMutations((store) => ({
    increment: rxMutation({
      operation: (params: Params) => {
        return calcSum(store.counter(), params.value);
      },
      operator: concatOp,
      onSuccess: (result) => {
        console.log('result', result);
        patchState(store, { counter: result });
      },
      onError: (error) => {
        console.error('Error occurred:', error);
      },
    }),
  })),
);

let error = false;

function createSumObservable(a: number, b: number): Observable<number> {
  return new Observable<number>((subscriber) => {
    const result = a + b;

    if ((result === 7 || result === 13) && !error) {
      subscriber.error({ message: 'error due to bad luck!', result });
      error = true;
    } else {
      subscriber.next(result);
      error = false;
    }
    subscriber.complete();
  });
}

function calcSum(a: number, b: number): Observable<number> {
  // return of(a + b);
  return createSumObservable(a, b).pipe(delay(500));
}
