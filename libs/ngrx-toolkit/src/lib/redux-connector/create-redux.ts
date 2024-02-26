import { ENVIRONMENT_INITIALIZER, inject, makeEnvironmentProviders } from "@angular/core";
import { ActionCreator, ActionType } from "@ngrx/store/src/models";
import { CreateReduxState, ExtractActionTypes, MapperTypes, Store } from "./model";
import { SignalReduxStore, injectReduxDispatch } from "./signal-redux-store";
import { capitalize, isActionCreator } from "./util";


export function mapAction<
  Creators extends readonly ActionCreator[]
>(
  ...args: [
    ...creators: Creators,
    storeMethod: (action: ActionType<Creators[number]>) => unknown
  ]
): MapperTypes<Creators>;
export function mapAction<
  Creators extends readonly ActionCreator[],
  T
>(
  ...args: [
    ...creators: Creators,
    storeMethod: (action: ActionType<Creators[number]>, resultMethod: (input: T) => unknown) => unknown,
    resultMethod: (input: T) => unknown
  ]
): MapperTypes<Creators>;
export function mapAction<
  Creators extends readonly ActionCreator[]
>(
  ...args: [
    ...creators: Creators,
    storeMethod: (action: ActionType<Creators[number]>) => unknown,
    resultMethod?: (input: unknown) => unknown
  ]
): MapperTypes<Creators> {
  let resultMethod = args.pop() as unknown as ((input: unknown) => unknown ) | undefined;
  let storeMethod = args.pop() as unknown as (action: ActionType<Creators[number]>) => unknown;

  if (isActionCreator(storeMethod)) {
    args.push(storeMethod);
    storeMethod = resultMethod || storeMethod;
    resultMethod = undefined;
  }

  const types = (args as unknown as Creators).map(
    (creator) => creator.type
  ) as unknown as ExtractActionTypes<Creators>;

  return {
    types,
    storeMethod,
    resultMethod
  };
}

export function withActionMappers(
  ...mappers: MapperTypes<ActionCreator<any, any>[]>[]
): MapperTypes<ActionCreator<any, any>[]>[] {
  return mappers;
}

export function createReduxState<
  StoreName extends string,
  STORE extends Store
>(
  storeName: StoreName,
  signalStore: STORE,
  withActionMappers: (store: InstanceType<STORE>) => MapperTypes<ActionCreator<any, any>[]>[],
): CreateReduxState<StoreName, STORE> {
  const isRootProvider = (signalStore as any)?.ɵprov?.providedIn === 'root';
  return {
    [`provide${capitalize(storeName)}Store`]: (connectReduxDevtools = false) => makeEnvironmentProviders([
      isRootProvider? [] : signalStore,
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useFactory: (
          signalReduxStore = inject(SignalReduxStore),
          store = inject(signalStore)
        ) => () => {
          if (connectReduxDevtools) {
            // addStoreToReduxDevtools(store, storeName, false);
          }
          signalReduxStore.connectFeatureStore(
            withActionMappers(store)
          );
        }
      }
    ]),
    [`inject${capitalize(storeName)}Store`]: () => Object.assign(
      inject(signalStore),
      { dispatch: injectReduxDispatch() }
    )
  } as CreateReduxState<StoreName, STORE>;
}
