import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlitchTrackingService {}

/**
 * Track all state changes of the State, including intermediary updates
 * that are typically suppressed by Angular's glitch-free mechanism.
 */
export function withGlitchTracking() {
  throw new Error('Not implemented');
}
