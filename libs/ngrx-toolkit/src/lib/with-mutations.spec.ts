import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { patchState, signalStore, withState } from '@ngrx/signals';
import { delay, Observable, of, switchMap, throwError } from 'rxjs';
import { rxMutation } from './rx-mutation';
import { withMutations } from './with-mutations';

async function asyncTick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

function calcDouble(value: number): Observable<number> {
  return of(value * 2).pipe(delay(1000));
}

function fail(_value: number): Observable<number> {
  return throwError(() => ({ error: 'Test-Error' })).pipe(delay(1000));
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

      expect(store.incrementStatus()).toEqual('idle');
      expect(store.incrementProcessing()).toEqual(false);

      store.increment(2);
      expect(store.incrementStatus()).toEqual('processing');
      expect(store.incrementProcessing()).toEqual(true);

      tick(2000);
      expect(store.incrementStatus()).toEqual('success');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual(undefined);

      expect(store.counter()).toEqual(7);
    });
  }));

  it('rxMutation sets error', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withState({ counter: 3 }),
        withMutations((store) => ({
          increment: rxMutation({
            operation: (value: number) => {
              return fail(value);
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
      expect(store.incrementStatus()).toEqual('error');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual({
        error: 'Test-Error',
      });

      expect(store.counter()).toEqual(3);
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
      expect(store.incrementStatus()).toEqual('processing');
      expect(store.incrementProcessing()).toEqual(true);

      store.increment(2);
      tick(1000);

      expect(store.incrementStatus()).toEqual('success');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual(undefined);

      expect(store.counter()).toEqual(7);
      expect(onSuccessCalls).toEqual(1);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 2,
        result: 4,
      });
    });
  }));

  it('rxMutation informs about aborted operations', async () => {
    await TestBed.runInInjectionContext(async () => {
      const Store = signalStore(
        withState({ counter: 3 }),
        withMutations((store) => ({
          increment: rxMutation({
            operation: (value: number) => {
              return calcDouble(value);
            },
            operator: switchMap,
            onSuccess: (result, params) => {
              patchState(store, (state) => ({
                counter: state.counter + result,
              }));
            },
          }),
        })),
      );

      const store = new Store();

      const p1 = store.increment(1);
      const p2 = store.increment(2);

      await asyncTick();

      const result1 = await p1;
      const result2 = await p2;

      expect(result1.status).toEqual('aborted');
      expect(result2.status).toEqual('success');
    });
  });
});
