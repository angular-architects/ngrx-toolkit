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
 * @example
 * const devToolsOptions: ReduxDevtoolsConfig = {
 *   name: 'My App',
 * };
 */
export type ReduxDevtoolsConfig = {
  /** Optional name for the devtools instance. If empty, "NgRx SignalStore" will be used. */
  name?: string;
};
