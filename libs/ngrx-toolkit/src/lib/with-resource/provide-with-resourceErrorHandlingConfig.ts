import { InjectionToken, ValueProvider } from '@angular/core';
import { ErrorHandling } from './with-resource';

/**
 * TODO - jsdoc
 */
export function provideWithResourceErrorHandlingConfig(
  config: WithResourceErrorHandlingConfig,
): ValueProvider {
  return {
    provide: WITH_RESOURCE_ERROR_HANDLING_CONFIG,
    useValue: config,
  };
}

// TODO - jsdoc
export const WITH_RESOURCE_ERROR_HANDLING_CONFIG =
  new InjectionToken<WithResourceErrorHandlingConfig>(
    'WithResourceErrorHandlingConfig',
  );

// TODO - jsdoc
export type WithResourceErrorHandlingConfig = {
  // TODO - jsdoc
  type?: ErrorHandling;
};
