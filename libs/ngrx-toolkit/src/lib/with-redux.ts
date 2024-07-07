import { Observable, Subject } from 'rxjs';
import { SignalStoreFeature, StateSignal } from '@ngrx/signals';
import { assertActionFnSpecs } from './assertions/assertions';
import {
  EmptyFeatureResult,
  SignalStoreFeatureResult,
} from './shared/signal-store-models';

/** Actions **/

type Payload = Record<string, unknown>;

type ActionFn<
  Type extends string = string,
  ActionPayload extends Payload = Payload
> = ((payload: ActionPayload) => ActionPayload & { type: Type }) & {
  type: Type;
};

type ActionFns = Record<string, ActionFn>;

export type ActionsFnSpecs = Record<string, Payload>;

type ActionFnCreator<Spec extends ActionsFnSpecs> = {
  [ActionName in keyof Spec]: (Record<never, never> extends Spec[ActionName]
    ? () => Spec[ActionName] & { type: ActionName }
    : (
        payload: Spec[ActionName]
      ) => Spec[ActionName] & { type: ActionName }) & {
    type: ActionName & string;
  };
};

type ActionFnPayload<Action> = Action extends (payload: infer Payload) => void
  ? Payload
  : never;

type ActionFnsCreator<Spec extends ActionsFnSpecs> = Spec extends {
  private: Record<string, Payload>;
  public: Record<string, Payload>;
}
  ? ActionFnCreator<Spec['private']> & ActionFnCreator<Spec['public']>
  : ActionFnCreator<Spec>;

type PublicActionFns<Spec extends ActionsFnSpecs> = Spec extends {
  public: Record<string, Payload>;
}
  ? ActionFnCreator<Spec['public']>
  : ActionFnCreator<Spec>;

export function payload<Type extends Payload>(): Type {
  return {} as Type;
}

export const noPayload = {};

/** Reducer **/

type ReducerFunction<ReducerAction, State> = (
  state: State,
  action: ActionFnPayload<ReducerAction>
) => void;

type ReducerFactory<StateActionFns extends ActionFns, State> = (
  actions: StateActionFns,
  on: <ReducerAction extends { type: string }>(
    action: ReducerAction,
    reducerFn: ReducerFunction<ReducerAction, State>
  ) => void
) => void;

/** Effect **/

type EffectsFactory<StateActionFns extends ActionFns> = (
  actions: StateActionFns,
  create: <EffectAction extends { type: string }>(
    action: EffectAction
  ) => Observable<ActionFnPayload<EffectAction>>
) => Record<string, Observable<unknown>>;

// internal types

/**
 * Record which holds all effects for a specific action type.
 * The values are Subject which the effect are subscribed to.
 * `createActionFns` will call next on these subjects.
 */
type EffectsRegistry = Record<string, Subject<ActionFnPayload<unknown>>[]>;

function createActionFns<Spec extends ActionsFnSpecs>(
  actionFnSpecs: Spec,
  reducerRegistry: Record<
    string,
    (state: unknown, payload: ActionFnPayload<unknown>) => void
  >,
  effectsRegistry: EffectsRegistry,
  state: unknown
) {
  const actionFns: Record<string, ActionFn> = {};

  for (const type in actionFnSpecs) {
    const actionFn = (payload: Payload) => {
      const fullPayload = { ...payload, type };
      const reducer = reducerRegistry[type];
      if (reducer) {
        (reducer as (state: unknown, payload: unknown) => void)(
          state,
          fullPayload as unknown
        );
      }
      const effectSubjects = effectsRegistry[type];
      if (effectSubjects?.length) {
        for (const effectSubject of effectSubjects) {
          (effectSubject as unknown as Subject<unknown>).next(fullPayload);
        }
      }
      return fullPayload;
    };
    actionFn.type = type.toString();
    actionFns[type] = actionFn;
  }

  return actionFns;
}

function createPublicAndAllActionsFns<Spec extends ActionsFnSpecs>(
  actionFnSpecs: Spec,
  reducerRegistry: Record<
    string,
    (state: unknown, payload: ActionFnPayload<unknown>) => void
  >,
  effectsRegistry: EffectsRegistry,
  state: unknown
): { all: ActionFns; publics: ActionFns } {
  if ('public' in actionFnSpecs || 'private' in actionFnSpecs) {
    const privates = actionFnSpecs['private'] || {};
    const publics = actionFnSpecs['public'] || {};

    assertActionFnSpecs(privates);
    assertActionFnSpecs(publics);

    const privateActionFns = createActionFns(
      privates,
      reducerRegistry,
      effectsRegistry,
      state
    );
    const publicActionFns = createActionFns(
      publics,
      reducerRegistry,
      effectsRegistry,
      state
    );

    return {
      all: { ...privateActionFns, ...publicActionFns },
      publics: publicActionFns,
    };
  }

  const actionFns = createActionFns(
    actionFnSpecs,
    reducerRegistry,
    effectsRegistry,
    state
  );

  return { all: actionFns, publics: actionFns };
}

function fillReducerRegistry(
  reducer: ReducerFactory<ActionFns, unknown>,
  actionFns: ActionFns,
  reducerRegistry: Record<
    string,
    (state: unknown, payload: ActionFnPayload<unknown>) => void
  >
) {
  function on(
    action: { type: string },
    reducerFn: (state: unknown, payload: ActionFnPayload<unknown>) => void
  ) {
    reducerRegistry[action.type] = reducerFn;
  }

  reducer(actionFns, on);

  return reducerRegistry;
}

function fillEffects(
  effects: EffectsFactory<ActionFns>,
  actionFns: ActionFns,
  effectsRegistry: EffectsRegistry = {}
): Observable<unknown>[] {
  function create(action: { type: string }) {
    const subject = new Subject<ActionFnPayload<unknown>>();
    if (!(action.type in effectsRegistry)) {
      effectsRegistry[action.type] = [];
    }
    effectsRegistry[action.type].push(subject);
    return subject.asObservable();
  }

  const effectObservables = effects(actionFns, create);
  return Object.values(effectObservables);
}

function startSubscriptions(observables: Observable<unknown>[]) {
  return observables.map((observable) => observable.subscribe());
}

function processRedux<Spec extends ActionsFnSpecs, ReturnType>(
  actionFnSpecs: Spec,
  reducer: ReducerFactory<ActionFns, unknown>,
  effects: EffectsFactory<ActionFns>,
  store: unknown
) {
  const reducerRegistry: Record<
    string,
    (state: unknown, payload: ActionFnPayload<unknown>) => void
  > = {};
  const effectsRegistry: Record<string, Subject<ActionFnPayload<unknown>>[]> =
    {};
  const actionsMap = createPublicAndAllActionsFns(
    actionFnSpecs,
    reducerRegistry,
    effectsRegistry,
    store
  );
  const actionFns = actionsMap.all;
  const publicActionsFns = actionsMap.publics;

  fillReducerRegistry(reducer, actionFns, reducerRegistry);
  const effectObservables = fillEffects(effects, actionFns, effectsRegistry);
  const subscriptions = startSubscriptions(effectObservables);

  return {
    methods: publicActionsFns as ReturnType,
    subscriptions: subscriptions,
  };
}

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
  Spec extends ActionsFnSpecs,
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
    const { methods } = processRedux<Spec, PublicStoreActionFns>(
      redux.actions,
      redux.reducer as ReducerFactory<ActionFns, unknown>,
      redux.effects as EffectsFactory<ActionFns>,
      store
    );
    return {
      ...store,
      methods,
    };
  };
}
