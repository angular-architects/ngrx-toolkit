import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { delay, Observable, of } from 'rxjs';
import { mutation, rxMutation, withMutations } from './mutation';

function calcDouble(value: number): Observable<number> {
  return of(value * 2).pipe(delay(1000));
}

describe('mutation', () => {
  it('rxMutation should update the state', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withState({ counter: 3 }),
        withMutations(),
        withMethods((store) => ({
          increment: rxMutation(store, {
            operation: (value: number) => calcDouble(value),
            onSuccess: (_params, result) => {
              patchState(store, (state) => ({
                counter: state.counter + result,
              }));
            },
          }),
        })),
      );
      const store = new Store();

      store.increment(2);
      tick(1000);
      expect(store.counter()).toEqual(7);
    });
  }));

  it('rxMutation deals with race conditions', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withState({ counter: 3 }),
        withMutations(),
        withMethods((store) => ({
          increment: rxMutation(store, {
            operation: (value: number) => calcDouble(value),
            onSuccess: (_params, result) => {
              patchState(store, (state) => ({
                counter: state.counter + result,
              }));
            },
            operator: 'switch',
          }),
        })),
      );

      const store = new Store();

      const successSpy = jest.fn();
      const errorSpy = jest.fn();

      store.increment.success.subscribe(successSpy);
      store.increment.error.subscribe(errorSpy);

      store.increment(1);
      tick(500);
      store.increment(2);
      tick(1000);

      expect(store.counter()).toEqual(7);
      expect(successSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(0);
      expect(successSpy).toHaveBeenCalledWith({ params: 2, result: 4 });
    });
  }));

  it('mutation should update the state', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withState({ counter: 3 }),
        withMutations(),
        withMethods((store) => ({
          increment: mutation(store, {
            operation: (value: number) => calcDouble(value),
            onSuccess: (_params, result) => {
              patchState(store, (state) => ({
                counter: state.counter + result,
              }));
            },
          }),
        })),
      );
      const store = new Store();

      store.increment(2);
      tick(1000);
      expect(store.counter()).toEqual(7);
    });
  }));
});
