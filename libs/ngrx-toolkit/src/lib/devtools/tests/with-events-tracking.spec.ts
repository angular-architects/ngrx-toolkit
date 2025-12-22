import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signalStore, type, withState } from '@ngrx/signals';
import {
  eventGroup,
  injectDispatch,
  on,
  withReducer,
} from '@ngrx/signals/events';
import { withEventsTracking } from '../features/with-events-tracking';
import { withDevtools } from '../with-devtools';
import { setupExtensions } from './helpers.spec';

const testEvents = eventGroup({
  source: 'Spec Store',
  events: {
    bump: type<void>(),
  },
});

describe('withEventsTracking', () => {
  it('should send a glitched update on event', async () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(
      { providedIn: 'root' },
      withDevtools('store-a', withEventsTracking()),
      withState({ count: 0 }),
      withReducer(
        on(testEvents.bump, (_event, state) => ({ count: state.count + 1 })),
      ),
    );

    TestBed.inject(Store);

    runInInjectionContext(TestBed.inject(EnvironmentInjector), () => {
      injectDispatch(testEvents).bump();
    });

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: '[Spec Store] bump' },
      { 'store-a': { count: 1 } },
    );
  });

  it('should emit two glitched updates when two stores react to the same event', async () => {
    const { sendSpy } = setupExtensions();

    const StoreA = signalStore(
      { providedIn: 'root' },
      withDevtools('store-a', withEventsTracking()),
      withState({ count: 0 }),
      withReducer(
        on(testEvents.bump, (_event, state) => ({ count: state.count + 1 })),
      ),
    );

    const StoreB = signalStore(
      { providedIn: 'root' },
      withDevtools('store-b', withEventsTracking()),
      withState({ count: 0 }),
      withReducer(
        on(testEvents.bump, (_event, state) => ({ count: state.count + 1 })),
      ),
    );

    TestBed.inject(StoreA);
    TestBed.inject(StoreB);

    runInInjectionContext(TestBed.inject(EnvironmentInjector), () => {
      injectDispatch(testEvents).bump();
    });

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: '[Spec Store] bump' },
      { 'store-a': { count: 1 }, 'store-b': { count: 1 } },
    );
  });
});
