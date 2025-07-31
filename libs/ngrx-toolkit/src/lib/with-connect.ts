import { computed } from '@angular/core';
import {
  EmptyFeatureResult,
  patchState,
  signalMethod,
  SignalStoreFeature,
  signalStoreFeature,
  SignalStoreFeatureResult,
  withMethods,
} from '@ngrx/signals';

export type WithConnectResultType<
  T extends SignalStoreFeatureResult,
  K extends keyof T['state']
> = EmptyFeatureResult & {
  methods: {
    connect(state: () => Partial<Pick<T['state'], K>>): void;
  };
};

export function withConnect<
  T extends SignalStoreFeatureResult,
  Keys extends readonly (keyof T['state'])[]
>(
  ...keys: Keys
): SignalStoreFeature<T, WithConnectResultType<T, Keys[number]>> {
  return signalStoreFeature(
    withMethods((store) => {
      return {
        connect(stateFn: () => Partial<Pick<T['state'], Keys[number]>>): void {
          const stateSignal = computed(stateFn);

          // TypeScript allows additional keys
          validateKeys(stateFn, keys);

          signalMethod<Partial<Pick<T['state'], Keys[number]>>>((state) => {
            patchState(store, state);
          })(stateSignal);
        },
      };
    })
  );
}

function validateKeys<
  T extends SignalStoreFeatureResult,
  Keys extends readonly (keyof T['state'])[]
>(stateFn: () => Partial<Pick<T['state'], Keys[number]>>, keys: Keys) {
  const candKeys = Object.keys(stateFn()) as unknown as Keys;
  for (const key of candKeys) {
    if (!keys.includes(key)) {
      throw new Error(`Key ${String(key)} is not provided via withConnect!`);
    }
  }
}
