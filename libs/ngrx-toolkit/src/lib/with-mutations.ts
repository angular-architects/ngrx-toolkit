import { computed, Signal } from '@angular/core';
import {
  signalStoreFeature,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
  StateSource,
  withComputed,
  withMethods,
  withState,
  WritableStateSource,
} from '@ngrx/signals';

// NamedMutationMethods below will infer the actual parameter and return types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationsDictionary = Record<string, Mutation<any, any>>;

export type Mutation<P, R> = (params: P) => Promise<R>;

export type MutationResult = {
  status: 'success' | 'aborted';
};

export type MutationStatus = 'idle' | 'processing' | 'error' | 'success';

// withMethods uses Record<string, Function> internally
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type MethodsDictionary = Record<string, Function>;

type NamedMutationState<T extends MutationsDictionary> = {
  [Prop in keyof T as `_${Prop & string}Count`]: number;
} & {
  [Prop in keyof T as `${Prop & string}Status`]: MutationStatus;
} & {
  [Prop in keyof T as `${Prop & string}Error`]: Error | undefined;
};

type NamedMutationProps<T extends MutationsDictionary> = {
  [Prop in keyof T as `${Prop & string}Processing`]: Signal<boolean>;
};

type NamedMutationMethods<T extends MutationsDictionary> = {
  [Prop in keyof T as `${Prop & string}`]: T[Prop] extends Mutation<
    infer P,
    infer R
  >
    ? (p: P) => Promise<R>
    : never;
};

export type NamedMutationResult<T extends MutationsDictionary> = {
  state: NamedMutationState<T>;
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

  const initState = keys.reduce(
    (acc, key) => ({
      ...acc,
      [`_${key}Count`]: 0,
      [`${key}Status`]: 'idle',
      [`${key}Error`]: undefined,
    }),
    {} as NamedMutationState<Result>,
  );

  const feature = signalStoreFeature(
    withState(initState),
    withMethods(() =>
      keys.reduce(
        (acc, key) => ({
          ...acc,
          [key]: async (params: unknown) => {
            const mutation = mutations[key];
            if (!mutation) throw new Error(`Mutation ${key} not found`);
            const result = await mutation(params);
            return result;
          },
        }),
        {} as MethodsDictionary,
      ),
    ),
    withComputed((store) =>
      keys.reduce(
        (acc, key) => ({
          ...acc,
          [`${key}Processing`]: computed(() => {
            return store[`_${key}Count`]() > 0;
          }),
        }),
        {} as NamedMutationProps<Result>,
      ),
    ),
  );
  return feature;
}
