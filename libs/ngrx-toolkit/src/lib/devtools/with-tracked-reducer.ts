import { inject, untracked } from '@angular/core';
import {
  EmptyFeatureResult,
  getState,
  PartialStateUpdater,
  SignalStoreFeature,
  signalStoreFeature,
  type,
} from '@ngrx/signals';
import {
  EventCreator,
  ReducerEvents,
  withEventHandlers,
} from '@ngrx/signals/events';
import { tap } from 'rxjs/operators';
import { GLITCH_TRACKING_FEATURE } from './features/with-glitch-tracking';
import { updateState } from './update-state';
import { DEVTOOL_PROP } from './with-devtools';

export function withTrackedReducer<
  State extends object,
  DevtoolsFeatureName extends string,
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...caseReducers: CaseReducerResult<State, any>[]
): SignalStoreFeature<
  EmptyFeatureResult & {
    state: State;
    props: {
      [DEVTOOL_PROP]: typeof GLITCH_TRACKING_FEATURE extends DevtoolsFeatureName
        ? DevtoolsFeatureName
        : 'NO GLITCHED TRACKING ACTIVATED';
    };
  },
  EmptyFeatureResult
> {
  return signalStoreFeature(
    {
      state: type<State>(),
    },
    withEventHandlers((store, events = inject(ReducerEvents)) =>
      caseReducers.map((caseReducer) =>
        events.on(...caseReducer.events).pipe(
          tap((event) => {
            const state = untracked(() => getState(store));
            const result = caseReducer.reducer(event, state);
            const updaters = Array.isArray(result) ? result : [result];

            updateState(store, event.type, ...updaters);
          }),
        ),
      ),
    ),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CaseReducerResult<State extends object, EventCreators extends any[]> = {
  reducer: CaseReducer<State, EventCreators>;
  events: EventCreators;
};

type CaseReducer<
  State extends object,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EventCreators extends EventCreator<string, any>[],
> = (
  event: { [K in keyof EventCreators]: ReturnType<EventCreators[K]> }[number],
  state: State,
) =>
  | Partial<State>
  | PartialStateUpdater<State>
  | Array<Partial<State> | PartialStateUpdater<State>>;
