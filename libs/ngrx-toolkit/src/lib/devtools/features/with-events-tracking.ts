import { inject } from '@angular/core';
import { ReducerEvents } from '@ngrx/signals/events';
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
 * The `GlitchTrackerService` is used to capture all intermediate updates (glitched states).
 *
 * @returns Devtools feature enabling events-based action naming with glitch tracking.
 * @example
 * withDevtools('counter', withEventsTracking());
 */
export function withEventsTracking() {
  return createDevtoolsFeature({
    tracker: GlitchTrackerService,
    eventsTracking: true,
    onInit: ({ trackEvents }) => {
      trackEvents(inject(ReducerEvents).on());
    },
  });
}
