import { getState, patchState, signalStore, withState } from '@ngrx/signals';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { withConnect } from './with-connect';

describe('withConnect', () => {
  const setup = () => {
    const Store = signalStore(
      { protectedState: false },
      withState({
        maxWarpFactor: 8,
        shipName: 'USS Enterprise',
        registration: 'NCC-1701',
        poeple: 430,
      }),
      withConnect('maxWarpFactor', 'registration', 'poeple')
    );

    const store = TestBed.configureTestingModule({
      providers: [Store],
    }).inject(Store);

    return { store };
  };

  it('should update store after connected signals are changed', fakeAsync(() => {
    const { store } = setup();

    TestBed.runInInjectionContext(() => {
      const maxWarpFactor = signal(9);
      const registration = signal('NCC-1701-D');
      const poeple = signal(1100);

      store.connect(() => ({
        maxWarpFactor: maxWarpFactor(),
        registration: registration(),
        poeple: poeple(),
      }));
      tick(1);
      expect(getState(store)).toMatchObject({
        maxWarpFactor: 9,
        shipName: 'USS Enterprise',
        registration: 'NCC-1701-D',
        poeple: 1100,
      });

      maxWarpFactor.set(9.6);
      tick(1);
      expect(getState(store).maxWarpFactor).toBeCloseTo(9.6);
      expect(getState(store).shipName).toEqual('USS Enterprise');

      patchState(store, { maxWarpFactor: 9.2 });
      tick(1);
      expect(getState(store).maxWarpFactor).toBeCloseTo(9.2);
      expect(getState(store).shipName).toEqual('USS Enterprise');

      // It's just a one-way-sync
      expect(maxWarpFactor()).toBeCloseTo(9.6);
    });
  }));
});
