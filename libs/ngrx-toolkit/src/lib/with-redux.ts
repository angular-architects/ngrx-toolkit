import { Observable } from 'rxjs';
import { SignalStoreFeature } from '@ngrx/signals';
import {
  EmptyFeatureResult,
  SignalStoreFeatureResult,
} from '@ngrx/signals/src/signal-store-models';
import { StateSignal } from '@ngrx/signals/src/state-signal';

/** Actions **/

type Payload = Record<string, unknown>;

type ActionFn<
  Type extends string = string,
  ActionPayload extends Payload = Payload
> = ((payload: ActionPayload) => ActionPayload & { type: Type }) & {
  type: Type;
};

type ActionFns = Record<string, ActionFn>;

type ActionsSpec = Record<string, Payload>;

type ActionFnCreator<Spec extends ActionsSpec> = {
  [ActionName in keyof Spec]: ((
    payload: Spec[ActionName]
  ) => Spec[ActionName] & { type: ActionName }) & { type: ActionName & string };
};

type ActionFnPayload<Action> = Action extends (payload: infer Payload) => void
  ? Payload
  : never;

type ActionFnsCreator<Spec extends ActionsSpec> = Spec extends {
  private: Record<string, Payload>;
  public: Record<string, Payload>;
}
  ? ActionFnCreator<Spec['private']> & ActionFnCreator<Spec['public']>
  : ActionFnCreator<Spec>;

type PublicActionFns<Spec extends ActionsSpec> = Spec extends {
  public: Record<string, Payload>;
}
  ? ActionFnCreator<Spec['public']>
  : ActionFnCreator<Spec>;

export function payload<Type extends Payload>(): Type {
  return {} as Type;
}

export const noPayload = {};

/** Reducer **/

type ReducerFactory<StateActionFns extends ActionFns, State> = (
  actions: StateActionFns,
  on: <ReducerAction>(
    action: ReducerAction,
    reducerFn: (action: ActionFnPayload<ReducerAction>, state: State) => void
  ) => void
) => void;

/** Effect **/

type EffectsFactory<StateActionFns extends ActionFns> = (
  actions: StateActionFns,
  create: <EffectAction>(
    action: EffectAction
  ) => Observable<ActionFnPayload<EffectAction>>
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
export function withRedux<
  Spec extends ActionsSpec,
  Input extends SignalStoreFeatureResult,
  StateActionFns extends ActionFnsCreator<Spec> = ActionFnsCreator<Spec>,
  PublicStoreActionFns extends PublicActionFns<Spec> = PublicActionFns<Spec>
>(redux: {
  actions: Spec;
  reducer: ReducerFactory<StateActionFns, StateSignal<Input['state']>>;
  effects: EffectsFactory<StateActionFns>;
}): SignalStoreFeature<
  Input,
  EmptyFeatureResult & { methods: PublicStoreActionFns }
> {
  return (store) => {
    const methods: PublicStoreActionFns = {} as unknown as PublicStoreActionFns;
    return { ...store, methods };
  };
}
