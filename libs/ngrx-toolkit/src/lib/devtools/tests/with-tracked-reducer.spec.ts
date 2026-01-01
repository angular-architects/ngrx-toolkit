import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  patchState,
  signalStore,
  signalStoreFeature,
  type,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  Dispatcher,
  eventGroup,
  Events,
  on,
  withEventHandlers,
} from '@ngrx/signals/events';
import { delay, tap } from 'rxjs';
import { withGlitchTracking } from '../features/with-glitch-tracking';
import { updateState } from '../update-state';
import { withDevtools } from '../with-devtools';
import { withTrackedReducer } from '../with-tracked-reducer';
import { setupExtensions } from './helpers.spec';

const testEvents = eventGroup({
  source: 'Spec Store',
  events: {
    bump: type<void>(),
  },
});

describe('withTrackedReducer', () => {
  it('should send a glitched update on event', async () => {
    const { sendSpy, withBasicStore } = setup();

    const Store = signalStore(
      { providedIn: 'root' },
      withBasicStore('store'),
      withTrackedReducer(
        on(testEvents.bump, (_, state) => ({ count: state.count + 1 })),
      ),
    );
    TestBed.inject(Store);

    dispatchBumpEvent();

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: '[Spec Store] bump' },
      { store: { count: 1 } },
    );
  });

  it('should emit two glitched updates when two stores react to the same event', async () => {
    const { sendSpy, withBasicStore } = setup();
    const StoreA = signalStore(
      { providedIn: 'root' },
      withBasicStore('store-a'),
      withTrackedReducer(
        on(testEvents.bump, (_, state) => ({ count: state.count + 1 })),
      ),
    );
    const StoreB = signalStore(
      { providedIn: 'root' },
      withBasicStore('store-b'),
      withTrackedReducer(
        on(testEvents.bump, (_, state) => ({ count: state.count + 1 })),
      ),
    );
    TestBed.inject(StoreA);
    TestBed.inject(StoreB);

    dispatchBumpEvent();

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: '[Spec Store] bump' },
      { 'store-a': { count: 1 }, 'store-b': { count: 1 } },
    );
  });

  it('should distinguish between two synchronous state changes in reducer and normal patchState', () => {
    const { sendSpy, withBasicStore } = setup();

    const Store = signalStore(
      { providedIn: 'root' },
      withBasicStore('store'),
      withTrackedReducer(
        on(testEvents.bump, (_, state) => ({ count: state.count + 1 })),
      ),
      withMethods((store) => ({
        bump: () => patchState(store, (state) => ({ count: state.count + 1 })),
      })),
    );
    const store = TestBed.inject(Store);

    dispatchBumpEvent();
    store.bump();

    const [lastButOneCall, lastCall] = sendSpy.mock.calls.slice(-2);
    expect(lastButOneCall).toEqual([
      { type: '[Spec Store] bump' },
      { store: { count: 1 } },
    ]);
    expect(lastCall).toEqual([
      { type: 'Store Update' },
      { store: { count: 2 } },
    ]);
  });

  // This could be more common than we think
  it('should not use action name if no reducer is used', () => {
    const { sendSpy, withBasicStore } = setup();

    const Store = signalStore(
      { providedIn: 'root' },
      withBasicStore('store'),
      withMethods((store) => ({
        bump: () => patchState(store, (state) => ({ count: state.count + 1 })),
      })),
    );

    const store = TestBed.inject(Store);
    dispatchBumpEvent();
    store.bump();

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: 'Store Update' },
      { store: { count: 1 } },
    );
  });

  it('should not have a race condition between the reducer and the tracker', () => {
    const { sendSpy } = setup();

    const Store = signalStore(
      { providedIn: 'root' },
      withState({ count: 0 }),
      withTrackedReducer(
        on(testEvents.bump, (_, state) => ({ count: state.count + 1 })),
      ),
      // Injecting this here, means the reducer gets notified before the tracker
      withDevtools('store', withGlitchTracking()),
    );

    TestBed.inject(Store);
    dispatchBumpEvent();

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: '[Spec Store] bump' },
      { store: { count: 1 } },
    );
  });

  it('should not label a synchronous patch in an event handler (event tracking only on reducer level)', async () => {
    const { sendSpy, withBasicStore } = setup();

    const Store = signalStore(
      { providedIn: 'root' },
      withBasicStore('store'),
      withState({ count: 0 }),
      withEventHandlers((store, events = inject(Events)) => [
        events
          .on(testEvents.bump)
          .pipe(
            tap(() =>
              patchState(store, (state) => ({ count: state.count + 1 })),
            ),
          ),
      ]),
    );

    TestBed.inject(Store);
    dispatchBumpEvent();

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: 'Store Update' },
      { store: { count: 1 } },
    );
  });

  it('should not label an async patch in the event handler', async () => {
    const { sendSpy, withBasicStore } = setup();

    const Store = signalStore(
      { providedIn: 'root' },
      withBasicStore('store'),
      withEventHandlers((store, events = inject(Events)) => [
        events.on(testEvents.bump).pipe(
          delay(0),
          tap(() => patchState(store, (state) => ({ count: state.count + 1 }))),
        ),
      ]),
    );

    TestBed.inject(Store);
    dispatchBumpEvent();
    await new Promise((resolve) => setTimeout(resolve));

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: 'Store Update' },
      { store: { count: 1 } },
    );
  });

  it('should use updateState action name in event handler if used', () => {
    const { sendSpy, withBasicStore } = setup();

    const Store = signalStore(
      { providedIn: 'root' },
      withBasicStore('store'),
      withEventHandlers((store, events = inject(Events)) => [
        events
          .on(testEvents.bump)
          .pipe(tap(() => updateState(store, 'Bump', { count: 1 }))),
      ]),
    );

    TestBed.inject(Store);
    dispatchBumpEvent();

    expect(sendSpy).toHaveBeenLastCalledWith(
      { type: 'Bump' },
      { store: { count: 1 } },
    );
  });
});

function dispatchBumpEvent() {
  TestBed.inject(Dispatcher).dispatch(testEvents.bump());
}

function setup() {
  const { sendSpy } = setupExtensions();

  function withBasicStore(name: string) {
    return signalStoreFeature(
      withDevtools(name, withGlitchTracking()),
      withState({ count: 0 }),
    );
  }
  return { sendSpy, withBasicStore };
}
