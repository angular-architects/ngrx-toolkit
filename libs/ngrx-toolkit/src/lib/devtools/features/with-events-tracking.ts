import { inject } from '@angular/core';
import { Dispatcher, Events } from '@ngrx/signals/events';
import { createDevtoolsFeature } from '../internal/devtools-feature';
import { GlitchTrackerService } from '../internal/glitch-tracker.service';

/**
 * Automatically infers DevTools action names from NgRx SignalStore events.
 *
 * It listens to all dispatched events via the Events stream and enqueues
 * the event's type as the upcoming DevTools action name. When the corresponding
 * reducer mutates state, the DevTools sync will use that name instead of
 * the default "Store Update".
 *
 * By default (withGlitchTracking = true), the `GlitchTrackerService` is used to capture
 * all intermediate updates (glitched states). To use the default, glitch-free tracker
 * and synchronize only stable state transitions, set `withGlitchTracking` to `false`.
 *
 * @param {{ withGlitchTracking?: boolean }} [options] Options to configure tracking behavior.
 * @param {boolean} [options.withGlitchTracking=true] Enable capturing intermediate (glitched) state updates.
 * @returns Devtools feature enabling events-based action naming; glitched tracking is enabled by default.
 * Set `withGlitchTracking: false` to use glitch-free tracking instead.
 * @example
 * // Capture intermediate updates (default)
 * withDevtools('counter', withEventsTracking());
 * @example
 * // Glitch-free tracking (only stable transitions)
 * withDevtools('counter', withEventsTracking({ withGlitchTracking: false }));
 * @see withGlitchTracking
 */
export function withEventsTracking(
  options: { withGlitchTracking: boolean } = { withGlitchTracking: true },
) {
  const useGlitchTracking = options.withGlitchTracking === true;
  return createDevtoolsFeature({
    tracker: useGlitchTracking ? GlitchTrackerService : undefined,
    eventsTracking: true,
    onInit: ({ trackEvents }) => {
      if (useGlitchTracking) {
        trackEvents(getReducerEvents().on());
      } else {
        trackEvents(inject(Events).on());
      }
    },
  });
}

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
  type ReducerEventsLike = {
    on(): ReturnType<Dispatcher['events']['on']>;
  };

  const dispatcher = inject(Dispatcher) as unknown as {
    reducerEvents: ReducerEventsLike;
  };
  return dispatcher.reducerEvents;
}
