import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { patchState, signalStore, withState } from '@ngrx/signals';
import {
  concatMap,
  delay,
  exhaustMap,
  mergeMap,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { rxMutation } from './rx-mutation';
import { withMutations } from './with-mutations';

async function asyncTick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

function calcDouble(value: number, delayInMsec = 1000): Observable<number> {
  return of(value * 2).pipe(delay(delayInMsec));
}

function fail(_value: number, delayInMsec = 1000): Observable<number> {
  return throwError(() => ({ error: 'Test-Error' })).pipe(delay(delayInMsec));
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

  it('rxMutation throws error and subsequent one succeeds', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withState({ counter: 3 }),
        withMutations((store) => ({
          increment: rxMutation({
            operation: (param: {
              value: number;
              delay: number;
              fail: boolean;
            }) => {
              if (param.fail) {
                return fail(param.value, param.delay);
              }
              return calcDouble(param.value, param.delay);
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

      store.increment({ value: 1, delay: 100, fail: true });
      store.increment({ value: 2, delay: 100, fail: false });

      tick(100);
      expect(store.incrementStatus()).toEqual('processing');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual({
        error: 'Test-Error',
      });

      expect(store.counter()).toEqual(3);
    });
  }));

  it('rxMutation deals with race conditions using switchMap', fakeAsync(() => {
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

      flushMicrotasks();

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

  it('rxMutation deals with race conditions using mergeMap', fakeAsync(() => {
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
            operator: mergeMap,
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
      tick(500);

      expect(store.incrementStatus()).toEqual('processing');
      expect(store.incrementProcessing()).toEqual(true);

      // expect(store.counter()).toEqual(7);
      expect(onSuccessCalls).toEqual(1);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 1,
        result: 2,
      });

      tick(500);

      expect(store.incrementStatus()).toEqual('success');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual(undefined);

      expect(store.counter()).toEqual(9);
      expect(onSuccessCalls).toEqual(2);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 2,
        result: 4,
      });
    });
  }));

  it('rxMutation deals with race conditions using concatMap', fakeAsync(() => {
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
            operation: (param: { value: number; delayInMsec: number }) => {
              return calcDouble(param.value, param.delayInMsec);
            },
            operator: concatMap,
            onSuccess: (result, params) => {
              lastOnSuccessParams.params = params.value;
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

      store.increment({ value: 1, delayInMsec: 1000 });
      tick(500);
      store.increment({ value: 2, delayInMsec: 100 });
      tick(500);

      expect(store.incrementStatus()).toEqual('processing');
      expect(store.incrementProcessing()).toEqual(true);

      // expect(store.counter()).toEqual(7);
      expect(onSuccessCalls).toEqual(1);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 1,
        result: 2,
      });

      tick(500);

      expect(store.incrementStatus()).toEqual('success');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual(undefined);

      expect(store.counter()).toEqual(9);
      expect(onSuccessCalls).toEqual(2);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 2,
        result: 4,
      });
    });
  }));

  it('rxMutation deals with race conditions using mergeMap and two tasks with different delays', fakeAsync(() => {
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
            operation: (param: { value: number; delayInMsec: number }) => {
              return calcDouble(param.value, param.delayInMsec);
            },
            operator: mergeMap,
            onSuccess: (result, params) => {
              lastOnSuccessParams.params = params.value;
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

      store.increment({ value: 1, delayInMsec: 1000 });
      tick(500);

      expect(store.incrementStatus()).toEqual('processing');
      expect(store.incrementProcessing()).toEqual(true);

      store.increment({ value: 2, delayInMsec: 100 });
      tick(500);

      expect(store.incrementStatus()).toEqual('success');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual(undefined);

      expect(store.counter()).toEqual(9);
      expect(onSuccessCalls).toEqual(2);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 1,
        result: 2,
      });
    });
  }));

  it('rxMutation deals with race conditions using exhaustMap', fakeAsync(() => {
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
            operation: (param: { value: number; delayInMsec: number }) => {
              return calcDouble(param.value, param.delayInMsec);
            },
            operator: exhaustMap,
            onSuccess: (result, params) => {
              lastOnSuccessParams.params = params.value;
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

      store.increment({ value: 1, delayInMsec: 1000 });
      tick(500);

      expect(store.incrementStatus()).toEqual('processing');
      expect(store.incrementProcessing()).toEqual(true);

      store.increment({ value: 2, delayInMsec: 100 });
      tick(500);

      expect(store.incrementStatus()).toEqual('success');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual(undefined);

      expect(store.counter()).toEqual(5);
      expect(onSuccessCalls).toEqual(1);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 1,
        result: 2,
      });

      tick(500);

      expect(store.incrementStatus()).toEqual('success');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementError()).toEqual(undefined);

      expect(store.counter()).toEqual(5);
      expect(onSuccessCalls).toEqual(1);
      expect(onErrorCalls).toEqual(0);
      expect(lastOnSuccessParams).toEqual({
        params: 1,
        result: 2,
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
            onSuccess: (result) => {
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

      expect(store.incrementProcessing()).toEqual(true);
      expect(store.incrementStatus()).toEqual('processing');

      await asyncTick();

      const result1 = await p1;
      const result2 = await p2;

      expect(result1.status).toEqual('aborted');
      expect(result2.status).toEqual('success');
      expect(store.incrementProcessing()).toEqual(false);
      expect(store.incrementStatus()).toEqual('success');
    });
  });
});
