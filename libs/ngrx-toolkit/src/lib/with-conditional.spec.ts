import { inject, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  getState,
  patchState,
  signalStore,
  signalStoreFeature,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { withDevtools } from './devtools/with-devtools';
import { emptyFeature, withConditional } from './with-conditional';

describe('withConditional', () => {
  const withUser = signalStoreFeature(
    withState({ id: 0, name: '' }),
    withHooks((store) => ({
      onInit() {
        patchState(store, { id: 1, name: 'Konrad' });
      },
    })),
  );

  const withFakeUser = signalStoreFeature(
    withState({ id: 0, name: 'Tommy Fake' }),
  );

  for (const isReal of [true, false]) {
    it(`should ${isReal ? '' : 'not '} enable withUser`, () => {
      const REAL_USER_TOKEN = new InjectionToken('REAL_USER', {
        providedIn: 'root',
        factory: () => isReal,
      });
      const UserStore = signalStore(
        { providedIn: 'root' },
        withConditional(() => inject(REAL_USER_TOKEN), withUser, withFakeUser),
      );
      const userStore = TestBed.inject(UserStore);

      if (isReal) {
        expect(getState(userStore)).toEqual({ id: 1, name: 'Konrad' });
      } else {
        expect(getState(userStore)).toEqual({ id: 0, name: 'Tommy Fake' });
      }
    });
  }

  it(`should access the store`, () => {
    const UserStore = signalStore(
      { providedIn: 'root' },
      withMethods(() => ({
        useRealUser: () => true,
      })),
      withConditional((store) => store.useRealUser(), withUser, withFakeUser),
    );
    const userStore = TestBed.inject(UserStore);

    expect(getState(userStore)).toEqual({ id: 1, name: 'Konrad' });
  });

  it('should be used inside a signalStoreFeature', () => {
    const withConditionalUser = (activate: boolean) =>
      signalStoreFeature(
        withConditional(() => activate, withUser, withFakeUser),
      );

    const UserStore = signalStore(
      { providedIn: 'root' },
      withConditionalUser(true),
    );
    const userStore = TestBed.inject(UserStore);

    expect(getState(userStore)).toEqual({ id: 1, name: 'Konrad' });
  });

  it('should ensure that both features return the same type', () => {
    const withUser = signalStoreFeature(
      withState({ id: 0, name: '' }),
      withHooks((store) => ({
        onInit() {
          patchState(store, { id: 1, name: 'Konrad' });
        },
      })),
    );

    const withFakeUser = signalStoreFeature(
      withState({ id: 0, firstname: 'Tommy Fake' }),
    );

    // @ts-expect-error withFakeUser has a different state shape
    signalStore(withConditional(() => true, withUser, withFakeUser));
  });

  it('should also work with empty features', () => {
    signalStore(
      withConditional(
        () => true,
        withDevtools('dummy'),
        signalStoreFeature(withState({})),
      ),
    );
  });

  it('should work with `emptyFeature` if falsy is skipped', () => {
    signalStore(
      withConditional(
        () => true,
        signalStoreFeature(withState({})),
        emptyFeature,
      ),
    );
  });

  it('should not work with `emptyFeature` if feature is not empty', () => {
    signalStore(
      withConditional(
        () => true,
        // @ts-expect-error feature is not empty
        () => signalStoreFeature(withState({ x: 1 })),
        emptyFeature,
      ),
    );
  });
});
