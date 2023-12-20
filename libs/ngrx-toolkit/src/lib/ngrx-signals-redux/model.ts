import { EnvironmentProviders, Signal, Type } from "@angular/core";
import { DeepSignal } from "@ngrx/signals/src/deep-signal";
import { SignalStoreFeatureResult } from "@ngrx/signals/src/signal-store-models";
import { StateSignal } from "@ngrx/signals/src/state-signal";
import { Action, ActionCreator, ActionType, Prettify } from "@ngrx/store/src/models";
import { Observable, Unsubscribable } from "rxjs";


export type IncludePropType<T, V, WithNevers =
  { [K in keyof T]: Exclude<T[K], undefined> extends V
    ? T[K] extends Record<string, unknown>
      ? IncludePropType<T[K], V>
      : T[K]
    : never
  }> = Prettify<
    Pick<
      WithNevers,
      { [K in keyof WithNevers]: WithNevers[K] extends never
        ? never
        : K extends string
          ? K
          : never
      }[keyof WithNevers]
    >
  >;

export type Store = Type<Record<string, unknown> & StateSignal<SignalStoreFeatureResult['state']>>;

export type CreateReduxState<
  StoreName extends string,
  STORE extends Store
> = {
  [K in StoreName as `provide${Capitalize<K>}Store`]: (connectReduxDevtools?: boolean) => EnvironmentProviders
} & {
  [K in StoreName as `inject${Capitalize<K>}Store`]: () => InjectableReduxSlice<STORE>
};

export type Selectors<STORE extends Store> = IncludePropType<InstanceType<STORE>, Signal<unknown> | DeepSignal<unknown>>;
export type Dispatch = { dispatch: (input: Action | Observable<Action> | Signal<Action>) => Unsubscribable };
export type InjectableReduxSlice<STORE extends Store> = Selectors<STORE> & Dispatch;

export type ExtractActionTypes<Creators extends readonly ActionCreator[]> = {
  [Key in keyof Creators]: Creators[Key] extends ActionCreator<infer T>
    ? T
    : never;
};

export interface ActionMethod<T, V extends Action = Action> {
  (action: V): T;
}

export interface StoreMethod<
  Creators extends readonly ActionCreator[],
  ResultState = unknown,
> {
  (
    action: ActionType<Creators[number]>
  ): ResultState;
}

export interface MapperTypes<
  Creators extends readonly ActionCreator[]
> {
  types: ExtractActionTypes<Creators>,
  storeMethod: StoreMethod<Creators>,
  resultMethod?: (...args: unknown[]) => unknown
}
