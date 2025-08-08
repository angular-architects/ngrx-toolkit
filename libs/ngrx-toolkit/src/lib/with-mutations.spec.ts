import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { patchState, signalStore, withState } from '@ngrx/signals';
import { delay, Observable, of, switchMap } from 'rxjs';
import { rxMutation } from './rx-mutation';
import { withMutations } from './with-mutations';

function calcDouble(value: number): Observable<number> {
  return of(value * 2).pipe(delay(1000));
}

describe('mutation', () => {
  it('rxMutation should update the state', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withState({ counter: 3 }),
        withMutations((store) => ({
          increment: rxMutation({
            operation: (value: number) => {
              return calcDouble(value);
            },
            onSuccess: (result) => {
              patchState(store, (state) => ({
                counter: state.counter + result,
              }));
            },
          }),
        })),
      );
      const store = new Store();
      store.increment(2);
      tick(2000);
      expect(store.counter()).toEqual(7);
    });
  }));

  it('rxMutation deals with race conditions', fakeAsync(() => {
    let onSuccessCalls = 0;
    let onErrorCalls = 0;
    const lastOnSuccessParams = {
      result: -1,
      params: -1,
    };

    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withState({ counter: 3 }),
        withMutations((store) => ({
          increment: rxMutation({
            operation: (value: number) => {
              return calcDouble(value);
            },
            operator: switchMap,
            onSuccess: (result, params) => {
              lastOnSuccessParams.params = params;
              lastOnSuccessParams.result = result;
              patchState(store, (state) => ({
                counter: state.counter + result,
              }));
              onSuccessCalls++;
            },
            onError: (_result) => {
              onErrorCalls++;
            },
          }),
        })),
      );

      const store = new Store();

      store.increment(1);
      tick(500);
      store.increment(2);
      tick(1000);

      expect(store.counter()).toEqual(7);
      expect(onSuccessCalls).toEqual(1);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 2,
        result: 4,
      });
    });
  }));
});
