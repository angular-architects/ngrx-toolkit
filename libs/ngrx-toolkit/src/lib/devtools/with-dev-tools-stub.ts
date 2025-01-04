import { withDevtools } from './with-devtools';

/**
 * Stub for DevTools integration. Can be used to disable DevTools in production.
 */
export const withDevToolsStub: typeof withDevtools = () => (store) => store;
