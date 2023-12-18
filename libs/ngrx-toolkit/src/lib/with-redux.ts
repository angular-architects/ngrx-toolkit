import { map, Observable, of, pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { signalStore, SignalStoreFeature } from '@ngrx/signals';
import {
  EmptyFeatureResult,
  SignalStoreFeatureResult,
} from '@ngrx/signals/src/signal-store-models';

type Action = { type: string };

type Actions = Record<string, Action>;

type State = Record<string, unknown>;

type Payload = Record<string, unknown>;

type ActionsSpec = Record<string, Payload>;

type ActionsCreator<Spec extends ActionsSpec> = Extract<
  keyof Spec,
  'private' | 'public'
> extends never
  ? {
      [ActionName in keyof Spec]: Spec[ActionName] & { type: ActionName };
    }
  : {
      [ActionName in keyof Spec['private']]: Spec['private'][ActionName] & {
        type: ActionName;
      };
    } & {
      [ActionName in keyof Spec['public']]: Spec['public'][ActionName] & {
        type: ActionName;
      };
    };

type PublicActions<Spec extends ActionsSpec> = Extract<
  keyof Spec,
  'private' | 'public'
> extends never
  ? {
      [ActionName in keyof Spec]: Spec[ActionName] & { type: ActionName };
    }
  : {
      [ActionName in keyof Spec['public']]: Spec['public'][ActionName] & {
        type: ActionName;
      };
    };

export function payload<Type extends Payload>(): Type {
  return {} as Type;
}

export const noPayload = {};

export declare function createActions<Spec extends ActionsSpec>(
  spec: Spec
): ActionsCreator<Spec>;

type ActionsFactory<StateActions extends Actions> = () => StateActions;

type ReducerFn<A extends Action = Action> = (
  action: A,
  reducerFn: (action: A, state: State) => State
) => void;

type ReducerFactory<A extends Actions> = (on: ReducerFn, actions: A) => void;

type EffectFn<A extends Action = Action> = {
  (action: A, effect: (action: Observable<A>) => Observable<Action>): void;
};

type EffectsFactory<StateActions extends Actions> = (
  actions: StateActions,
  forAction: <EffectAction extends Action>(
    action: EffectAction
  ) => Observable<EffectAction>
) => void;

/**
 * @param redux redux
 *
 * properties do not start with `with` since they are not extension functions on their own.
 *
 * no dependency to NgRx
 *
 * actions are passed to reducer and effects, but it is also possible to use other actions.
 * effects provide forAction and do not return anything. that is important because effects should stay inaccessible
 */
export declare function withRedux<
  Spec extends ActionsSpec,
  StateActions extends Actions,
  Input extends SignalStoreFeatureResult
>(redux: {
  actions: StateActions;
  // actions: (actionsCreator: (spec: ActionsSpec) => StateActions) => void;
  reducer: ReducerFactory<StateActions>;
  effects: EffectsFactory<StateActions>;
}): SignalStoreFeature<
  Input,
  EmptyFeatureResult & { methods: { actions: () => StateActions } }
>;
