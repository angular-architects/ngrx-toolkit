import { computed, Signal } from '@angular/core';
import {
  EmptyFeatureResult,
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
  StateSource,
  withComputed,
  withMethods,
  WritableStateSource,
} from '@ngrx/signals';

export type Mutation<P, R> = {
  (params: P): Promise<MutationResult<R>>;
  status: Signal<MutationStatus>;
  callCount: Signal<number>;
  error: Signal<unknown>;
};

// NamedMutationMethods below will infer the actual parameter and return types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationsDictionary = Record<string, Mutation<any, any>>;

export type MutationResult<T> =
  | {
      status: 'success';
      value: T;
    }
  | {
      status: 'error';
      error: unknown;
    }
  | {
      status: 'aborted';
    };

export type MutationStatus = 'idle' | 'processing' | 'error' | 'success';

// withMethods uses Record<string, Function> internally
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type MethodsDictionary = Record<string, Function>;

type NamedMutationProps<T extends MutationsDictionary> = {
  [Prop in keyof T as `${Prop & string}Processing`]: Signal<boolean>;
} & {
  [Prop in keyof T as `${Prop & string}Status`]: Signal<MutationStatus>;
} & {
  [Prop in keyof T as `${Prop & string}Error`]: Signal<Error | undefined>;
};

type NamedMutationMethods<T extends MutationsDictionary> = {
  [Prop in keyof T as `${Prop & string}`]: T[Prop] extends Mutation<
    infer P,
    infer R
  >
    ? Mutation<P, R>
    : never;
};

export type NamedMutationResult<T extends MutationsDictionary> =
  EmptyFeatureResult & {
    props: NamedMutationProps<T>;
    methods: NamedMutationMethods<T>;
  };

export function withMutations<
  Input extends SignalStoreFeatureResult,
  Result extends MutationsDictionary,
>(
  mutationsFactory: (
    store: Input['props'] &
      Input['methods'] &
      WritableStateSource<Input['state']> &
      StateSignals<Input['state']>,
  ) => Result,
): SignalStoreFeature<Input, NamedMutationResult<Result>>;

export function withMutations<
  Input extends SignalStoreFeatureResult,
  Result extends MutationsDictionary,
>(
  mutationsFactory: (
    store: Input['props'] & Input['methods'] & StateSource<Input['state']>,
  ) => Result,
): SignalStoreFeature<Input> {
  return (store) => {
    // TODO: Is this the correct usage?
    const source = store as StateSource<typeof store.stateSignals>;
    const mutations = mutationsFactory({
      ...source,
      ...store.props,
      ...store.methods,
      ...store.stateSignals,
    });

    const feature = createMutationsFeature(mutations);
    return feature(store);
  };
}

function createMutationsFeature<Result extends MutationsDictionary>(
  mutations: Result,
) {
  const keys = Object.keys(mutations);

  const feature = signalStoreFeature(
    withMethods(() =>
      keys.reduce(
        (acc, key) => ({
          ...acc,
          [key]: async (params: never) => {
            const mutation = mutations[key];
            if (!mutation) {
              throw new Error(`Mutation ${key} not found`);
            }
            const result = await mutation(params);
            return result;
          },
        }),
        {} as MethodsDictionary,
      ),
    ),
    withComputed(() =>
      keys.reduce(
        (acc, key) => ({
          ...acc,
          [`${key}Processing`]: computed(() => {
            return mutations[key].callCount() > 0;
          }),
          [`${key}Status`]: mutations[key].status,
          [`${key}Error`]: mutations[key].error,
        }),
        {} as NamedMutationProps<Result>,
      ),
    ),
  );
  return feature;
}
