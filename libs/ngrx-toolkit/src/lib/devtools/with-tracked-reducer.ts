import { inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EmptyFeatureResult,
  getState,
  PartialStateUpdater,
  SignalStoreFeature,
  signalStoreFeature,
  type,
  withHooks,
} from '@ngrx/signals';
import { Dispatcher, EventCreator } from '@ngrx/signals/events';
import { merge, tap } from 'rxjs';
import { GLITCH_TRACKING_FEATURE } from './features/with-glitch-tracking';
import { updateState } from './update-state';
import { DEVTOOL_FEATURE_NAMES } from './with-devtools';

export function withTrackedReducer<State extends object>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...caseReducers: CaseReducerResult<State, any>[]
): SignalStoreFeature<
  EmptyFeatureResult & {
    state: State;
  },
  EmptyFeatureResult
> {
  return signalStoreFeature(
    {
      state: type<State>(),
    },
    withHooks((store) => ({
      onInit() {
        if (!(DEVTOOL_FEATURE_NAMES in store)) {
          throw new Error(
            `In order to use withTrackedReducer, you must first enable the devtools feature via withDevtools('[your store name]', withGlitchTracking())`,
          );
        }
        if (
          !(store[DEVTOOL_FEATURE_NAMES] as string[]).includes(
            GLITCH_TRACKING_FEATURE,
          )
        ) {
          throw new Error(
            `In order to use withTrackedReducer, you must first enable the glitch tracking devtools feature via withDevtools('[your store name]', withGlitchTracking())`,
          );
        }

        const events = getReducerEvents();
        const updates = caseReducers.map((caseReducer) =>
          events.on(...caseReducer.events).pipe(
            tap((event) => {
              const state = untracked(() => getState(store));
              const result = caseReducer.reducer(event, state);
              const updaters = Array.isArray(result) ? result : [result];

              updateState(store, event.type, ...updaters);
            }),
          ),
        );

        merge(...updates)
          .pipe(takeUntilDestroyed())
          .subscribe();
      },
    })),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CaseReducerResult<State extends object, EventCreators extends any[]> = {
  reducer: CaseReducer<State, EventCreators>;
  events: EventCreators;
};

type CaseReducer<
  State extends object,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EventCreators extends EventCreator<string, any>[],
> = (
  event: { [K in keyof EventCreators]: ReturnType<EventCreators[K]> }[number],
  state: State,
) =>
  | Partial<State>
  | PartialStateUpdater<State>
  | Array<Partial<State> | PartialStateUpdater<State>>;

/**
 * Returns the synchronous reducer event stream exposed by the dispatcher.
 *
 * NgRx's `Dispatcher` delivers events to `ReducerEvents` immediately but feeds
 * the public `Events` stream via `queueScheduler`, which keeps work in a FIFO
 * queue and executes scheduled tasks only after the current task completes
 * ([rxjs.dev](https://rxjs.dev/api/index/const/queueScheduler)). When
 * `GlitchTrackerService` captures the state change synchronously, that queued
 * `Events` emission is processed afterward and DevTools records the update as
 * `Store Update`. Tapping into the reducer stream keeps event names and state
 * changes aligned.
 *
 * TODO(@ngrx): expose a synchronous events API (similar to what `withReducer` uses)
 * so consumers do not need to reach into dispatcher internals.
 */
function getReducerEvents() {
  type ReducerEventsLike = Dispatcher['reducerEvents'];

  const dispatcher = inject(Dispatcher) as unknown as {
    reducerEvents: ReducerEventsLike;
  };
  return dispatcher.reducerEvents;
}
