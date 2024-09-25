import { InjectionToken } from '@angular/core';

export type DevtoolsConfig = {
  logOnly: boolean;
};

export const DEFAULT_DEVTOOLS_CONFIG: DevtoolsConfig = {
  logOnly: false,
};

export const DEVTOOLS_CONFIG = new InjectionToken<DevtoolsConfig>('DEVTOOLS_CONFIG');


/**
 * Provide a custom configuration for the devtools.
 * @param config The custom configuration.
 *
 * @example
 * ```ts
 * provideStoreDevtoolsConfig({
 *  logOnly: !isDevMode(), // Enable the log-only mode when not in production. (Default: false)
 * });
 *  ```
 *
 *  @returns The provider of the custom configuration.
 */
export const provideStoreDevtoolsConfig = (config: Partial<DevtoolsConfig>) => {
  return {
    provide: DEVTOOLS_CONFIG,
    useValue: {
      ...DEFAULT_DEVTOOLS_CONFIG,
      ...config,
    } satisfies DevtoolsConfig,
  };
}
