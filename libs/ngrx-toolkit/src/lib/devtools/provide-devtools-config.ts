import { InjectionToken, ValueProvider } from '@angular/core';

/**
 * Provides the configuration options for connecting to the Redux DevTools Extension.
 */
export function provideDevtoolsConfig(
  config: ReduxDevtoolsConfig
): ValueProvider {
  return {
    provide: REDUX_DEVTOOLS_CONFIG,
    useValue: config,
  };
}

/**
 * Injection token for the configuration options for connecting to the Redux DevTools Extension.
 */
export const REDUX_DEVTOOLS_CONFIG = new InjectionToken<ReduxDevtoolsConfig>(
  'ReduxDevtoolsConfig'
);

/**
 * Options for connecting to the Redux DevTools Extension.
 *
 * This interface represents the configuration options that can be passed
 * to the Redux DevTools Extension's connect function. It includes options
 * for enabling features, serialization, tracing, action creators, and other
 * settings that control the behavior and appearance of the DevTools.
 * See {@link https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md the Redux DevTools API documentation}.
 *
 * @example
 * const devToolsOptions: ReduxDevtoolsConfig = {
 *   name: 'My App',
 *   trace: true,
 *   traceLimit: 10,
 *   latency: 300,
 *   maxAge: 50,
 *   autoPause: true,
 *   shouldHotReload: false,
 *   shouldRecordChanges: true
 * };
 */
export type ReduxDevtoolsConfig = {
  /** Optional name for the devtools instance */
  name?: string;
  /** An optional unique instance ID (useful when you have multiple stores) */
  instanceId?: string;
  /** Enables stack trace recording for dispatched actions */
  trace?: boolean;
  /** Limits the number of stack trace frames stored per action */
  traceLimit?: number;
  /** Specifies a delay (in milliseconds) between dispatching actions */
  latency?: number;
  /** Maximum number of actions to keep in the history */
  maxAge?: number;
  /** Automatically pause recording when the devtools window is not open */
  autoPause?: boolean;
  /** Recompute state on hot reload */
  shouldHotReload?: boolean;
  /** Record state changes; set to false to disable */
  shouldRecordChanges?: boolean;
};
