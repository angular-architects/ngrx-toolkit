import { createDevtoolsFeature } from '../internal/devtools-feature';

/**
 * Automatically infers DevTools action names from NgRx SignalStore events.
 *
 * It listens to all dispatched events via the Events stream and enqueues
 * the event's type as the upcoming DevTools action name. When the corresponding
 * reducer mutates state, the DevTools sync will use that name instead of
 * the default "Store Update".
 */
export function withEventsTracking() {
  return createDevtoolsFeature({ eventsTracking: true });
}
