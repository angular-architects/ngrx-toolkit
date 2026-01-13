import { createDevtoolsFeature } from '../internal/devtools-feature';
import { GlitchTrackerService } from '../internal/glitch-tracker.service';

export const GLITCH_TRACKING_FEATURE = 'GLITCH_TRACKING_FEATURE' as const;

/**
 * It tracks all state changes of the State, including intermediary updates
 * that are typically suppressed by Angular's glitch-free mechanism.
 *
 * This feature is especially useful for debugging.
 *
 * Example:
 *
 * ```typescript
 * const Store = signalStore(
 *   { providedIn: 'root' },
 *   withState({ count: 0 }),
 *   withDevtools('counter', withGlitchTracking()),
 *   withMethods((store) => ({
 *     increase: () =>
 *       patchState(store, (value) => ({ count: value.count + 1 })),
 *   }))
 * );
 *
 * // would show up in the DevTools with value 0
 * const store = inject(Store);
 *
 * store.increase(); // would show up in the DevTools with value 1
 * store.increase(); // would show up in the DevTools with value 2
 * store.increase(); // would show up in the DevTools with value 3
 * ```
 *
 * Without `withGlitchTracking`, the DevTools would only show the final value of 3.
 */
export function withGlitchTracking() {
  return createDevtoolsFeature(
    {
      tracker: GlitchTrackerService,
    },
    GLITCH_TRACKING_FEATURE,
  );
}
