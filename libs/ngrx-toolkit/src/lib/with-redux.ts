import { Observable } from 'rxjs';
import { SignalStoreFeature } from '@ngrx/signals';
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
      [ActionName in keyof Spec]: Spec[ActionName] & {
        type: ActionName & string;
      };
    }
  : {
      [ActionName in keyof Spec['private']]: Spec['private'][ActionName] & {
        type: ActionName & string;
      };
    } & {
      [ActionName in keyof Spec['public']]: Spec['public'][ActionName] & {
        type: ActionName & string;
      };
    };

type PublicActions<Spec extends ActionsSpec> = Extract<
  keyof Spec,
  'private' | 'public'
> extends never
  ? {
      [ActionName in keyof Spec]: Spec[ActionName] & {
        type: ActionName & string;
      };
    }
  : {
      [ActionName in keyof Spec['public']]: Spec['public'][ActionName] & {
        type: ActionName & string;
      };
    };

export function payload<Type extends Payload>(): Type {
  return {} as Type;
}

export const noPayload = {};

export declare function createActions<Spec extends ActionsSpec>(
  spec: Spec
): ActionsCreator<Spec>;

type ReducerFn<A extends Action = Action> = (
  action: A,
  reducerFn: (action: A, state: State) => State
) => void;

type ReducerFactory<A extends Actions> = (on: ReducerFn, actions: A) => void;

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
  Input extends SignalStoreFeatureResult,
  StoreActions extends ActionsCreator<Spec> = ActionsCreator<Spec>,
  PublicStoreActions extends PublicActions<Spec> = PublicActions<Spec>
>(redux: {
  actions: Spec;
  reducer: ReducerFactory<StoreActions>;
  effects: EffectsFactory<StoreActions>;
}): SignalStoreFeature<
  Input,
  EmptyFeatureResult & { methods: { actions: () => PublicStoreActions } }
>;
