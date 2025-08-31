import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { patchState, signalStore, withState } from '@ngrx/signals';
import { delay, Observable, of, Subject, switchMap, throwError } from 'rxjs';
import { concatOp, exhaustOp, mergeOp, switchOp } from './flattening-operator';
import { rxMutation } from './rx-mutation';
import { withMutations } from './with-mutations';

type Param =
  | number
  | {
      value: number | Observable<number>;
      delay?: number;
      fail?: boolean;
    };

type NormalizedParam = {
  value: number | Observable<number>;
  delay: number;
  fail: boolean;
};

async function asyncTick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 0);
  });
}

function calcDouble(value: number, delayInMsec = 1000): Observable<number> {
  return of(value * 2).pipe(delay(delayInMsec));
}

function fail(_value: number, delayInMsec = 1000): Observable<number> {
  return of(null).pipe(
    delay(delayInMsec),
    switchMap(() => throwError(() => ({ error: 'Test-Error' }))),
  );
}

function createTestSetup(flatteningOperator = concatOp) {
  function normalizeParam(param: Param): NormalizedParam {
    if (typeof param === 'number') {
      return {
        value: param,
        delay: 1000,
        fail: false,
      };
    }

    return {
      value: param.value,
      delay: param.delay ?? 1000,
      fail: param.fail ?? false,
    };
  }

  type SuccessParams = { result: number; params: Param };
  type ErrorParams = { error: unknown; params: Param };

  let onSuccessCalls = 0;
  let onErrorCalls = 0;

  let lastOnSuccessParams: SuccessParams | undefined = undefined;
  let lastOnErrorParams: ErrorParams | undefined = undefined;

  return TestBed.runInInjectionContext(() => {
    const Store = signalStore(
      withState({ counter: 3 }),
      withMutations((store) => ({
        increment: rxMutation({
          operation: (param: Param) => {
            const normalized = normalizeParam(param);

            if (normalized.value instanceof Observable) {
              return normalized.value.pipe(
                switchMap((value) => {
                  if (normalized.fail) {
                    return fail(value, normalized.delay);
                  }
                  return calcDouble(value, normalized.delay);
                }),
              );
            }

            if (normalized.fail) {
              return fail(normalized.value, normalized.delay);
            }
            return calcDouble(normalized.value, normalized.delay);
          },
          operator: flatteningOperator,
          onSuccess: (result, params) => {
            lastOnSuccessParams = { result, params };
            onSuccessCalls++;
            patchState(store, (state) => ({
              counter: state.counter + result,
            }));
          },
          onError: (error, params) => {
            lastOnErrorParams = { error, params };
            onErrorCalls++;
          },
        }),
      })),
    );

    const store = new Store();
    return {
      store,
      onSuccessCalls: () => onSuccessCalls,
      onErrorCalls: () => onErrorCalls,
      lastOnSuccessParams: () => lastOnSuccessParams,
      lastOnErrorParams: () => lastOnErrorParams,
    };
  });
}

describe('withMutations', () => {
  it('rxMutation should update the state', fakeAsync(() => {
    const testSetup = createTestSetup();
    const store = testSetup.store;

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
  }));

  it('rxMutation sets error', fakeAsync(() => {
    const testSetup = createTestSetup();
    const store = testSetup.store;

    store.increment({ value: 2, fail: true });

    tick(2000);
    expect(store.incrementStatus()).toEqual('error');
    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementError()).toEqual({
      error: 'Test-Error',
    });

    expect(store.counter()).toEqual(3);
  }));

  it('rxMutation starts two concurrent operations using concatMap: the first one fails and the second one succeeds', fakeAsync(() => {
    const testSetup = createTestSetup(concatOp);
    const store = testSetup.store;

    store.increment({ value: 1, delay: 100, fail: true });
    store.increment({ value: 2, delay: 200, fail: false });

    tick(100);

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);
    expect(store.incrementError()).toEqual({
      error: 'Test-Error',
    });

    tick(200);

    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementError()).toEqual(undefined);

    expect(store.counter()).toEqual(7);
  }));

  it('rxMutation starts two concurrent operations using mergeMap: the first one fails and the second one succeeds', fakeAsync(() => {
    const testSetup = createTestSetup(mergeOp);
    const store = testSetup.store;

    store.increment({ value: 1, delay: 100, fail: true });
    store.increment({ value: 2, delay: 200, fail: false });

    tick(100);

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);
    expect(store.incrementError()).toEqual({
      error: 'Test-Error',
    });

    tick(100);

    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementError()).toEqual(undefined);

    expect(store.counter()).toEqual(7);
  }));

  it('rxMutation deals with race conditions using switchMap', fakeAsync(() => {
    const testSetup = createTestSetup(switchOp);
    const store = testSetup.store;

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
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParams()).toEqual({
      params: 2,
      result: 4,
    });
  }));

  it('rxMutation deals with race conditions using mergeMap', fakeAsync(() => {
    const testSetup = createTestSetup(mergeOp);
    const store = testSetup.store;

    store.increment(1);
    tick(500);
    store.increment(2);
    tick(500);

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    // expect(store.counter()).toEqual(7);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParams()).toEqual({
      params: 1,
      result: 2,
    });

    tick(500);

    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementError()).toEqual(undefined);

    expect(store.counter()).toEqual(9);
    expect(testSetup.onSuccessCalls()).toEqual(2);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParams()).toEqual({
      params: 2,
      result: 4,
    });
  }));

  it('rxMutation deals with race conditions using concatMap', fakeAsync(() => {
    const testSetup = createTestSetup(concatOp);
    const store = testSetup.store;

    store.increment({ value: 1, delay: 1000 });
    tick(500);
    store.increment({ value: 2, delay: 100 });
    tick(500);

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    expect(store.counter()).toEqual(5);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParams()).toEqual({
      params: { value: 1, delay: 1000 },
      result: 2,
    });

    tick(500);

    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementError()).toEqual(undefined);

    expect(store.counter()).toEqual(9);
    expect(testSetup.onSuccessCalls()).toEqual(2);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParams()).toEqual({
      params: { value: 2, delay: 100 },
      result: 4,
    });
  }));

  it('rxMutation deals with race conditions using mergeMap and two tasks with different delays', fakeAsync(() => {
    const testSetup = createTestSetup(mergeOp);
    const store = testSetup.store;

    store.increment({ value: 1, delay: 1000 });
    tick(500);

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    store.increment({ value: 2, delay: 100 });
    tick(500);

    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementError()).toEqual(undefined);

    expect(store.counter()).toEqual(9);
    expect(testSetup.onSuccessCalls()).toEqual(2);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParams()).toEqual({
      params: { value: 1, delay: 1000 },
      result: 2,
    });
  }));

  it('rxMutation deals with race conditions using exhaustMap', fakeAsync(() => {
    const testSetup = createTestSetup(exhaustOp);
    const store = testSetup.store;

    store.increment({ value: 1, delay: 1000 });
    tick(500);

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    store.increment({ value: 2, delay: 100 });
    tick(500);

    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementError()).toEqual(undefined);

    expect(store.counter()).toEqual(5);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParams()).toEqual({
      params: { value: 1, delay: 1000 },
      result: 2,
    });

    tick(500);

    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementError()).toEqual(undefined);

    expect(store.counter()).toEqual(5);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParams()).toEqual({
      params: { value: 1, delay: 1000 },
      result: 2,
    });
  }));

  it('rxMutation informs about failed operation via the returned promise', async () => {
    const testSetup = createTestSetup(switchOp);
    const store = testSetup.store;

    const p1 = store.increment({ value: 1, delay: 1, fail: false });
    const p2 = store.increment({ value: 2, delay: 2, fail: true });

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    await asyncTick();

    const result1 = await p1;
    const result2 = await p2;

    expect(result1.status).toEqual('aborted');
    expect(result2).toEqual({
      status: 'error',
      error: {
        error: 'Test-Error',
      },
    });

    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementStatus()).toEqual('error');
    expect(store.incrementError()).toEqual({
      error: 'Test-Error',
    });
  });

  it('rxMutation informs about successful operation via the returned promise', async () => {
    const testSetup = createTestSetup(switchOp);
    const store = testSetup.store;

    const p1 = store.increment({ value: 1, delay: 1, fail: false });
    const p2 = store.increment({ value: 2, delay: 2, fail: false });

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    await asyncTick();

    const result1 = await p1;
    const result2 = await p2;

    expect(result1.status).toEqual('aborted');
    expect(result2).toEqual({
      status: 'success',
      value: 4,
    });

    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementError()).toBeUndefined();
  });

  it('rxMutation informs about aborted operation when using exhaustMap', async () => {
    const testSetup = createTestSetup(exhaustOp);
    const store = testSetup.store;

    const p1 = store.increment({ value: 1, delay: 1, fail: false });
    const p2 = store.increment({ value: 2, delay: 1, fail: false });

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    await asyncTick();

    const result1 = await p1;
    const result2 = await p2;

    expect(result1).toEqual({
      status: 'success',
      value: 2,
    });

    expect(result2.status).toEqual('aborted');

    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementError()).toBeUndefined();
  });

  it('rxMutation calls success handler per value in the stream and returns the final value via the promise', async () => {
    const testSetup = createTestSetup(switchOp);
    const store = testSetup.store;

    const input$ = new Subject<number>();
    const resultPromise = store.increment({
      value: input$,
      delay: 1,
      fail: false,
    });

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    input$.next(1);
    input$.next(2);
    input$.next(3);
    input$.complete();

    await asyncTick();

    const result = await resultPromise;

    expect(result).toEqual({
      status: 'success',
      value: 6,
    });

    expect(store.counter()).toEqual(9);
    expect(testSetup.lastOnSuccessParams()).toMatchObject({
      result: 6,
    });

    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementStatus()).toEqual('success');
    expect(store.incrementError()).toBeUndefined();
  });

  it('rxMutation informs about failed operation via the returned promise', async () => {
    const testSetup = createTestSetup(switchOp);
    const store = testSetup.store;

    const p1 = store.increment({ value: 1, delay: 1, fail: false });
    const p2 = store.increment({ value: 2, delay: 2, fail: true });

    expect(store.incrementStatus()).toEqual('processing');
    expect(store.incrementProcessing()).toEqual(true);

    await asyncTick();

    const result1 = await p1;
    const result2 = await p2;

    expect(result1.status).toEqual('aborted');
    expect(result2).toEqual({
      status: 'error',
      error: {
        error: 'Test-Error',
      },
    });

    expect(store.incrementProcessing()).toEqual(false);
    expect(store.incrementStatus()).toEqual('error');
    expect(store.incrementError()).toEqual({
      error: 'Test-Error',
    });
  });
});
