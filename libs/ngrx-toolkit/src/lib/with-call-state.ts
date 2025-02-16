import { Signal, computed } from '@angular/core';
import {
  EmptyFeatureResult,
  SignalStoreFeature,
  signalStoreFeature,
  withComputed,
  withState,
} from '@ngrx/signals';

export type CallState = 'init' | 'loading' | 'loaded' | { error: string };

export type CallStateSlice = {
  callState: CallState;
};

export type NamedCallStateSlice<Collection extends string> = {
  [K in keyof CallStateSlice as `${Collection}${Capitalize<K>}`]: CallStateSlice[K];
};

export type CallStateSignals = {
  loading: Signal<boolean>;
  loaded: Signal<boolean>;
  error: Signal<string | null>;
};

export type NamedCallStateSignals<Prop extends string> = {
  [K in keyof CallStateSignals as `${Prop}${Capitalize<K>}`]: CallStateSignals[K];
};

export type SetCallState<Prop extends string | undefined> = Prop extends string
  ? NamedCallStateSlice<Prop>
  : CallStateSlice;

export function getCallStateKeys(config?: { collection?: string }) {
  const prop = config?.collection;
  return {
    callStateKey: prop ? `${config.collection}CallState` : 'callState',
    loadingKey: prop ? `${config.collection}Loading` : 'loading',
    loadedKey: prop ? `${config.collection}Loaded` : 'loaded',
    errorKey: prop ? `${config.collection}Error` : 'error',
  };
}

export function withCallState<Collection extends string>(config: {
  collection: Collection | Collection[];
}): SignalStoreFeature<
  EmptyFeatureResult,
  EmptyFeatureResult & {
    state: NamedCallStateSlice<Collection>;
    props: NamedCallStateSignals<Collection>;
  }
>;
export function withCallState(): SignalStoreFeature<
  EmptyFeatureResult,
  EmptyFeatureResult & {
    state: CallStateSlice;
    props: CallStateSignals;
  }
>;
export function withCallState<Collection extends string>(config?: {
  collection: Collection | Collection[];
}): SignalStoreFeature {
  const collections = Array.isArray(config?.collection) ? config.collection : [config?.collection];
  const keys = collections.reduce((acc, collection) => {
    const { callStateKey, errorKey, loadedKey, loadingKey } = getCallStateKeys({ collection });
    acc.callStateKeys.push(callStateKey);
    acc.errorKeys.push(errorKey);
    acc.loadedKeys.push(loadedKey);
    acc.loadingKeys.push(loadingKey);
    return acc;
  }, { callStateKeys: [], errorKeys: [], loadedKeys: [], loadingKeys: [] });

  return signalStoreFeature(
    withState(keys.callStateKeys.reduce((acc, key) => {
      acc[key] = 'init';
      return acc;
    }, {})),
    withComputed((state: Record<string, Signal<unknown>>) => {
      return keys.callStateKeys.reduce((acc, callStateKey, index) => {
        const callState = state[callStateKey] as Signal<CallState>;
        acc[keys.loadingKeys[index]] = computed(() => callState() === 'loading');
        acc[keys.loadedKeys[index]] = computed(() => callState() === 'loaded');
        acc[keys.errorKeys[index]] = computed(() => {
          const v = callState();
          return typeof v === 'object' ? v.error : null;
        });
        return acc;
      }, {});
    })
  );
}

export function setLoading<Prop extends string>(
  prop: Prop | Prop[]
): SetCallState<Prop> {
  const props = Array.isArray(prop) ? prop : [prop];
  return props.reduce((acc, p) => {
    acc[`${p}CallState`] = 'loading';
    return acc;
  }, {} as SetCallState<Prop>);
}

export function setLoaded<Prop extends string>(
  prop: Prop | Prop[]
): SetCallState<Prop> {
  const props = Array.isArray(prop) ? prop : [prop];
  return props.reduce((acc, p) => {
    acc[`${p}CallState`] = 'loaded';
    return acc;
  }, {} as SetCallState<Prop>);
}

export function setError<Prop extends string>(
  error: unknown,
  prop: Prop | Prop[]
): SetCallState<Prop> {
  let errorMessage: string;

  if (!error) {
    errorMessage = '';
  } else if (typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  } else {
    errorMessage = String(error);
  }

  const props = Array.isArray(prop) ? prop : [prop];
  return props.reduce((acc, p) => {
    acc[`${p}CallState`] = { error: errorMessage };
    return acc;
  }, {} as SetCallState<Prop>);
}
