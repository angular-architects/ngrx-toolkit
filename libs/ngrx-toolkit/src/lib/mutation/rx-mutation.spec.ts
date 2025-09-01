import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { delay, Observable, of, Subject, switchMap, throwError } from 'rxjs';
import { concatOp, exhaustOp, mergeOp, switchOp } from '../flattening-operator';
import { rxMutation } from './rx-mutation';

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

  type SuccessParam = { result: number; param: Param };
  type ErrorParam = { error: unknown; param: Param };

  let onSuccessCalls = 0;
  let onErrorCalls = 0;
  let counter = 3;

  let lastOnSuccessParam: SuccessParam | undefined = undefined;
  let lastOnErrorParam: ErrorParam | undefined = undefined;

  return TestBed.runInInjectionContext(() => {
    const increment = rxMutation({
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
      onSuccess: (result, param) => {
        lastOnSuccessParam = { result, param: param };
        onSuccessCalls++;
        counter = counter + result;
      },
      onError: (error, param) => {
        lastOnErrorParam = { error, param: param };
        onErrorCalls++;
      },
    });

    return {
      increment,
      getCounter: () => counter,
      onSuccessCalls: () => onSuccessCalls,
      onErrorCalls: () => onErrorCalls,
      lastOnSuccessParam: () => lastOnSuccessParam,
      lastOnErrorParam: () => lastOnErrorParam,
    };
  });
}

describe('rxMutation', () => {
  it('should update the state', fakeAsync(() => {
    const testSetup = createTestSetup();
    const increment = testSetup.increment;

    expect(increment.status()).toEqual('idle');
    expect(increment.isPending()).toEqual(false);

    increment(2);
    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);

    tick(2000);
    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.isSuccess()).toEqual(true);
    expect(increment.error()).toEqual(undefined);

    expect(testSetup.getCounter()).toEqual(7);
  }));

  it('sets error', fakeAsync(() => {
    const testSetup = createTestSetup();
    const increment = testSetup.increment;

    increment({ value: 2, fail: true });

    tick(2000);
    expect(increment.status()).toEqual('error');
    expect(increment.isPending()).toEqual(false);
    expect(increment.isSuccess()).toEqual(false);
    expect(increment.error()).toEqual({
      error: 'Test-Error',
    });

    expect(testSetup.getCounter()).toEqual(3);
  }));

  it('starts two concurrent operations using concatMap: the first one fails and the second one succeeds', fakeAsync(() => {
    const testSetup = createTestSetup(concatOp);
    const increment = testSetup.increment;

    increment({ value: 1, delay: 100, fail: true });
    increment({ value: 2, delay: 200, fail: false });

    tick(100);

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.error()).toEqual({
      error: 'Test-Error',
    });

    tick(200);

    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.error()).toEqual(undefined);

    expect(testSetup.getCounter()).toEqual(7);
  }));

  it('starts two concurrent operations using mergeMap: the first one fails and the second one succeeds', fakeAsync(() => {
    const testSetup = createTestSetup(mergeOp);
    const increment = testSetup.increment;

    increment({ value: 1, delay: 100, fail: true });
    increment({ value: 2, delay: 200, fail: false });

    tick(100);

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    expect(increment.error()).toEqual({
      error: 'Test-Error',
    });

    tick(100);

    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.isSuccess()).toEqual(true);

    expect(increment.error()).toEqual(undefined);

    expect(testSetup.getCounter()).toEqual(7);
  }));

  it('deals with race conditions using switchMap', fakeAsync(() => {
    const testSetup = createTestSetup(switchOp);
    const increment = testSetup.increment;

    increment(1);

    tick(500);
    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);

    increment(2);
    tick(1000);

    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.error()).toEqual(undefined);
    expect(increment.isSuccess()).toEqual(true);

    expect(testSetup.getCounter()).toEqual(7);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);

    expect(testSetup.lastOnSuccessParam()).toEqual({
      param: 2,
      result: 4,
    });
  }));

  it('deals with race conditions using mergeMap', fakeAsync(() => {
    const testSetup = createTestSetup(mergeOp);
    const increment = testSetup.increment;

    increment(1);
    tick(500);
    increment(2);
    tick(500);

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    // expect(testSetup.getCounter()).toEqual(7);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParam()).toEqual({
      param: 1,
      result: 2,
    });

    tick(500);

    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.error()).toEqual(undefined);
    expect(increment.isSuccess()).toEqual(true);

    expect(testSetup.getCounter()).toEqual(9);
    expect(testSetup.onSuccessCalls()).toEqual(2);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParam()).toEqual({
      param: 2,
      result: 4,
    });
  }));

  it('deals with race conditions using mergeMap where the 2nd task starts after and finishes before the 1st one', fakeAsync(() => {
    const testSetup = createTestSetup(mergeOp);
    const increment = testSetup.increment;

    increment({ value: 1, delay: 1000 });
    tick(500);

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    increment({ value: 2, delay: 100 });
    tick(500);

    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.error()).toEqual(undefined);
    expect(increment.isSuccess()).toEqual(true);

    expect(testSetup.getCounter()).toEqual(9);
    expect(testSetup.onSuccessCalls()).toEqual(2);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParam()).toEqual({
      param: { value: 1, delay: 1000 },
      result: 2,
    });
  }));

  it('deals with race conditions using concatMap', fakeAsync(() => {
    const testSetup = createTestSetup(concatOp);
    const increment = testSetup.increment;

    increment({ value: 1, delay: 1000 });
    tick(500);
    increment({ value: 2, delay: 100 });
    tick(500);

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    expect(testSetup.getCounter()).toEqual(5);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParam()).toEqual({
      param: { value: 1, delay: 1000 },
      result: 2,
    });

    tick(500);

    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.error()).toEqual(undefined);
    expect(increment.isSuccess()).toEqual(true);

    expect(testSetup.getCounter()).toEqual(9);
    expect(testSetup.onSuccessCalls()).toEqual(2);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParam()).toEqual({
      param: { value: 2, delay: 100 },
      result: 4,
    });
  }));

  it('deals with race conditions using exhaustMap', fakeAsync(() => {
    const testSetup = createTestSetup(exhaustOp);
    const increment = testSetup.increment;

    increment({ value: 1, delay: 1000 });
    tick(500);

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    increment({ value: 2, delay: 100 });
    tick(500);

    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.error()).toEqual(undefined);
    expect(increment.isSuccess()).toEqual(true);

    expect(testSetup.getCounter()).toEqual(5);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParam()).toEqual({
      param: { value: 1, delay: 1000 },
      result: 2,
    });

    tick(500);

    expect(increment.status()).toEqual('success');
    expect(increment.isPending()).toEqual(false);
    expect(increment.error()).toEqual(undefined);
    expect(increment.isSuccess()).toEqual(true);

    expect(testSetup.getCounter()).toEqual(5);
    expect(testSetup.onSuccessCalls()).toEqual(1);
    expect(testSetup.onErrorCalls()).toEqual(0);
    expect(testSetup.lastOnSuccessParam()).toEqual({
      param: { value: 1, delay: 1000 },
      result: 2,
    });
  }));

  it('informs about failed operation via the returned promise', async () => {
    const testSetup = createTestSetup(switchOp);
    const increment = testSetup.increment;

    const p1 = increment({ value: 1, delay: 1, fail: false });
    const p2 = increment({ value: 2, delay: 2, fail: true });

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

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

    expect(increment.isPending()).toEqual(false);
    expect(increment.status()).toEqual('error');
    expect(increment.isSuccess()).toEqual(false);

    expect(increment.error()).toEqual({
      error: 'Test-Error',
    });
  });

  it('informs about successful operation via the returned promise', async () => {
    const testSetup = createTestSetup();
    const increment = testSetup.increment;

    const resultPromise = increment({ value: 2, delay: 2, fail: false });

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    await asyncTick();

    const result = await resultPromise;

    expect(result).toEqual({
      status: 'success',
      value: 4,
    });

    expect(increment.isPending()).toEqual(false);
    expect(increment.isSuccess()).toEqual(true);

    expect(increment.status()).toEqual('success');
    expect(increment.error()).toBeUndefined();
  });

  it('informs about aborted operation when using switchMap', async () => {
    const testSetup = createTestSetup(switchOp);
    const increment = testSetup.increment;

    const p1 = increment({ value: 1, delay: 1, fail: false });
    const p2 = increment({ value: 2, delay: 2, fail: false });

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    await asyncTick();

    const result1 = await p1;
    const result2 = await p2;

    expect(result1.status).toEqual('aborted');
    expect(result2).toEqual({
      status: 'success',
      value: 4,
    });

    expect(increment.isPending()).toEqual(false);
    expect(increment.status()).toEqual('success');
    expect(increment.isSuccess()).toEqual(true);

    expect(increment.value()).toEqual(4);
    expect(increment.hasValue()).toEqual(true);
    expect(increment.error()).toBeUndefined();
  });

  it('informs about aborted operation when using exhaustMap', async () => {
    const testSetup = createTestSetup(exhaustOp);
    const increment = testSetup.increment;

    const p1 = increment({ value: 1, delay: 1, fail: false });
    const p2 = increment({ value: 2, delay: 1, fail: false });

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    await asyncTick();

    const result1 = await p1;
    const result2 = await p2;

    expect(result1).toEqual({
      status: 'success',
      value: 2,
    });

    expect(result2.status).toEqual('aborted');

    expect(increment.isPending()).toEqual(false);
    expect(increment.status()).toEqual('success');
    expect(increment.isSuccess()).toEqual(true);
    expect(increment.error()).toBeUndefined();
  });

  it('calls success handler per value in the stream and returns the final value via the promise', async () => {
    const testSetup = createTestSetup(switchOp);
    const increment = testSetup.increment;

    const input$ = new Subject<number>();
    const resultPromise = increment({
      value: input$,
      delay: 1,
      fail: false,
    });

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

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

    expect(testSetup.getCounter()).toEqual(9);
    expect(testSetup.lastOnSuccessParam()).toMatchObject({
      result: 6,
    });

    expect(increment.isPending()).toEqual(false);
    expect(increment.status()).toEqual('success');
    expect(increment.isSuccess()).toEqual(true);

    expect(increment.error()).toBeUndefined();
  });

  it('informs about failed operation via the returned promise', async () => {
    const testSetup = createTestSetup(switchOp);
    const increment = testSetup.increment;

    const p1 = increment({ value: 1, delay: 1, fail: false });
    const p2 = increment({ value: 2, delay: 2, fail: true });

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

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

    expect(increment.isPending()).toEqual(false);
    expect(increment.hasValue()).toEqual(false);
    expect(increment.status()).toEqual('error');
    expect(increment.isSuccess()).toEqual(false);
    expect(increment.error()).toEqual({
      error: 'Test-Error',
    });
  });

  it('can be called using an operation function', async () => {
    const increment = TestBed.runInInjectionContext(() =>
      rxMutation((value: number) => {
        return calcDouble(value).pipe(delay(1));
      }),
    );

    const resultPromise = increment(2);

    expect(increment.status()).toEqual('pending');
    expect(increment.isPending()).toEqual(true);
    expect(increment.isSuccess()).toEqual(false);

    await asyncTick();

    const result = await resultPromise;

    expect(result).toEqual({
      status: 'success',
      value: 4,
    });

    expect(increment.isPending()).toEqual(false);
    expect(increment.isSuccess()).toEqual(true);

    expect(increment.status()).toEqual('success');
    expect(increment.error()).toBeUndefined();
  });
});
