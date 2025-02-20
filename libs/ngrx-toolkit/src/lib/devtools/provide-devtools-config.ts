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
 *   maxAge: 50
 * };
 */
export type ReduxDevtoolsConfig = {
  /** Optional name for the devtools instance. If empty, "NgRx SignalStore" will be used. */
  name?: string;
  /** Maximum number of actions to keep in the history */
  maxAge?: number;
};
