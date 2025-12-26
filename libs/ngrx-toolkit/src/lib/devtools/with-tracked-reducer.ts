import { inject, untracked } from '@angular/core';
import {
  EmptyFeatureResult,
  getState,
  PartialStateUpdater,
  SignalStoreFeature,
  signalStoreFeature,
  type,
} from '@ngrx/signals';
import { ReducerEvents, withEventHandlers } from '@ngrx/signals/events';
import { tap } from 'rxjs/operators';
import { updateState } from './update-state';

export function withTrackedReducer<State extends object>(
  ...caseReducers: CaseReducerResult<State, any>[]
): SignalStoreFeature<
  EmptyFeatureResult & { state: State },
  EmptyFeatureResult
> {
  return signalStoreFeature(
    { state: type<State>() },
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

type EventInstance<Type extends string, Payload> = {
  type: Type;
  payload: Payload;
};

type EventCreator<Type extends string, Payload> = ((
  payload: Payload,
) => EventInstance<Type, Payload>) & { type: Type };

type CaseReducerResult<
  State extends object,
  EventCreators extends EventCreator<string, any>[],
> = {
  reducer: CaseReducer<State, EventCreators>;
  events: EventCreators;
};

type CaseReducer<
  State extends object,
  EventCreators extends EventCreator<string, any>[],
> = (
  event: { [K in keyof EventCreators]: ReturnType<EventCreators[K]> }[number],
  state: State,
) =>
  | Partial<State>
  | PartialStateUpdater<State>
  | Array<Partial<State> | PartialStateUpdater<State>>;
