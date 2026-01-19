import { signalStoreFeature, withProps } from '@ngrx/signals';
import { GLITCH_TRACKING_FEATURE } from './features/with-glitch-tracking';
import { DEVTOOL_FEATURE_NAMES, withDevtools } from './with-devtools';
/**
 * Stub for DevTools integration. Can be used to disable DevTools in production.
 */
export const withDevToolsStub: typeof withDevtools = () =>
  signalStoreFeature(
    withProps(
      () =>
        ({
          [DEVTOOL_FEATURE_NAMES]: [GLITCH_TRACKING_FEATURE],
        }) as Record<string, never>,
    ),
  );
