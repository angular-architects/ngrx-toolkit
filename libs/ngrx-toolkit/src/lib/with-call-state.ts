import { Signal, computed } from '@angular/core';
import {
  EmptyFeatureResult,
  patchState,
  SignalStoreFeature,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export type CallState = 'init' | 'loading' | 'loaded' | { error: string };

export type CallStateSlice = {
  callState: CallState;
};

export type NamedCallStateSlice<Collection extends string> = {
  [K in keyof CallStateSlice as Collection extends ''
    ? `${Collection}${K}`
    : `${Collection}${Capitalize<K>}`]: CallStateSlice[K];
};

export type CallStateSignals = {
  loading: Signal<boolean>;
  loaded: Signal<boolean>;
  error: Signal<string | null>;
};

export type NamedCallStateSignals<Prop extends string> = {
  [K in keyof CallStateSignals as Prop extends ''
    ? `${Prop}${K}`
    : `${Prop}${Capitalize<K>}`]: CallStateSignals[K];
};

export type CallStateUpdaters = {
  setLoading: () => void;
  setLoaded: () => void;
  setError: (error: unknown) => void;
};

export type NamedCallStateUpdaters<Prop extends string> = {
  [K in keyof CallStateUpdaters as Prop extends ''
    ? `${Prop}${K}`
    : `${Prop}${Capitalize<K>}`]: CallStateUpdaters[K];
};

export type SetCallState<Prop extends string | undefined> = Prop extends string
  ? NamedCallStateSlice<Prop>
  : CallStateSlice;

export function deriveCallStateKeys<Collection extends string>(
  collection?: Collection
) {
  return {
    callStateKey: collection ? `${collection}CallState` : 'callState',
    loadingKey: collection ? `${collection}Loading` : 'loading',
    loadedKey: collection ? `${collection}Loaded` : 'loaded',
    errorKey: collection ? `${collection}Error` : 'error',
  };
}

export function deriveCallStateUpdaterKeys<Collection extends string>(
  collection?: Collection
) {
  return {
    loadingKey: collection ? `${collection}SetLoading` : 'setLoading',
    loadedKey: collection ? `${collection}SetLoaded` : 'setLoaded',
    errorKey: collection ? `${collection}SetError` : 'setError',
  };
}

export function getCallStateKeys(config?: { collection?: string }) {
  const prop = config?.collection;
  return deriveCallStateKeys(prop);
}

export function getCollectionArray(
  config: { collection?: string } | { collections?: string[] }
) {
  return 'collections' in config
    ? config.collections
    : 'collection' in config && config.collection
    ? [config.collection]
    : undefined;
}

export function withCallState<Collection extends string>(config: {
  collections: Collection[];
}): SignalStoreFeature<
  EmptyFeatureResult,
  EmptyFeatureResult & {
    state: NamedCallStateSlice<Collection>;
    props: NamedCallStateSignals<Collection>;
    methods: NamedCallStateUpdaters<Collection>;
  }
>;
export function withCallState<Collection extends string>(config: {
  collection: Collection;
}): SignalStoreFeature<
  EmptyFeatureResult,
  EmptyFeatureResult & {
    state: NamedCallStateSlice<Collection>;
    props: NamedCallStateSignals<Collection>;
    methods: NamedCallStateUpdaters<Collection>;
  }
>;
export function withCallState(): SignalStoreFeature<
  EmptyFeatureResult,
  EmptyFeatureResult & {
    state: CallStateSlice;
    props: CallStateSignals;
    methods: CallStateUpdaters;
  }
>;
export function withCallState<Collection extends string>(
  config?:
    | {
        collection: Collection;
      }
    | {
        collections: Collection[];
      }
): SignalStoreFeature {
  return signalStoreFeature(
    withState(() => {
      if (!config) {
        return { callState: 'init' };
      }
      const collections = getCollectionArray(config);
      if (collections) {
        return collections.reduce(
          (acc, cur) => ({
            ...acc,
            ...{ [cur ? `${cur}CallState` : 'callState']: 'init' },
          }),
          {}
        );
      }

      return { callState: 'init' };
    }),
    withComputed((state: Record<string, Signal<unknown>>) => {
      if (config) {
        const collections = getCollectionArray(config);
        if (collections) {
          return collections.reduce<Record<string, Signal<unknown>>>(
            (acc, cur: string) => {
              const { callStateKey, errorKey, loadedKey, loadingKey } =
                deriveCallStateKeys(cur);
              const callState = state[callStateKey] as Signal<CallState>;
              return {
                ...acc,
                [loadingKey]: computed(() => callState() === 'loading'),
                [loadedKey]: computed(() => callState() === 'loaded'),
                [errorKey]: computed(() => {
                  const v = callState();
                  return typeof v === 'object' ? v.error : null;
                }),
              };
            },
            {}
          );
        }
      }
      const { callStateKey, errorKey, loadedKey, loadingKey } =
        deriveCallStateKeys();
      const callState = state[callStateKey] as Signal<CallState>;
      return {
        [loadingKey]: computed(() => callState() === 'loading'),
        [loadedKey]: computed(() => callState() === 'loaded'),
        [errorKey]: computed(() => {
          const v = callState();
          return typeof v === 'object' ? v.error : null;
        }),
      };
    }),
    withMethods((state) => {
      if (config) {
        const collections = getCollectionArray(config);
        if (collections) {
          return collections.reduce<
            Record<string, (...args: unknown[]) => void>
          >((acc, cur: string) => {
            const { loadingKey, loadedKey, errorKey } =
              deriveCallStateUpdaterKeys(cur);
            return {
              ...acc,
              [loadingKey]: () => patchState(state, setLoading(cur)),
              [loadedKey]: () => patchState(state, setLoaded(cur)),
              [errorKey]: (error: unknown) =>
                patchState(state, setError(error, cur)),
            };
          }, {});
        }
      }
      const { loadingKey, loadedKey, errorKey } = deriveCallStateUpdaterKeys();
      return {
        [loadingKey]: () => patchState(state, setLoading()),
        [loadedKey]: () => patchState(state, setLoaded()),
        [errorKey]: (error: unknown) => patchState(state, setError(error)),
      };
    })
  );
}

export function setLoading<Prop extends string | undefined = undefined>(
  prop?: Prop
): SetCallState<Prop> {
  if (prop) {
    return { [`${prop}CallState`]: 'loading' } as SetCallState<Prop>;
  }

  return { callState: 'loading' } as SetCallState<Prop>;
}

export function setLoaded<Prop extends string | undefined = undefined>(
  prop?: Prop
): SetCallState<Prop> {
  if (prop) {
    return { [`${prop}CallState`]: 'loaded' } as SetCallState<Prop>;
  } else {
    return { callState: 'loaded' } as SetCallState<Prop>;
  }
}

export function setError<Prop extends string | undefined = undefined>(
  error: unknown,
  prop?: Prop
): SetCallState<Prop> {
  let errorMessage: string;

  if (!error) {
    errorMessage = '';
  } else if (typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  } else {
    errorMessage = String(error);
  }

  if (prop) {
    return {
      [`${prop}CallState`]: { error: errorMessage },
    } as SetCallState<Prop>;
  } else {
    return { callState: { error: errorMessage } } as SetCallState<Prop>;
  }
}
