import { Observable } from 'rxjs';
import { Tracker } from './models';

export const DEVTOOLS_FEATURE = Symbol('DEVTOOLS_FEATURE');

export type Mapper = (state: object) => object;

export type DevtoolsHookContext = {
  id: string;
  name: string;
  trackEvents: (source: Observable<{ type: string }>) => void;
};

export type DevtoolsOptions = {
  indexNames?: boolean; // defines if names should be indexed.
  map?: Mapper; // defines a mapper for the state.
  tracker?: new () => Tracker; // defines a tracker for the state
  eventsTracking?: boolean; // enables @ngrx/signals/events → DevTools action name tracking
  onInit?: (context: DevtoolsHookContext) => void; // lifecycle hook executed during devtools init
};

export type DevtoolsInnerOptions = {
  indexNames: boolean;
  map: Mapper;
  tracker: Tracker;
  eventsTracking: boolean;
};

/**
 * A DevtoolsFeature adds or modifies the behavior of the
 * devtools extension.
 *
 * We use them (function calls) instead of a config object,
 * because of tree-shaking.
 */
export type DevtoolsFeature = {
  [DEVTOOLS_FEATURE]: true;
} & Partial<DevtoolsOptions>;

export function createDevtoolsFeature(
  options: DevtoolsOptions,
): DevtoolsFeature {
  return {
    [DEVTOOLS_FEATURE]: true,
    ...options,
  };
}
