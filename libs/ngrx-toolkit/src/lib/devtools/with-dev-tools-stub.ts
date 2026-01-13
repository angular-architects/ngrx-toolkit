import { signalStoreFeature, withProps } from '@ngrx/signals';
import { DEVTOOL_PROP, withDevtools } from './with-devtools';

/**
 * Stub for DevTools integration. Can be used to disable DevTools in production.
 */
export const withDevToolsStub: typeof withDevtools = () =>
  signalStoreFeature(withProps(() => ({ [DEVTOOL_PROP]: [] as [] })));
