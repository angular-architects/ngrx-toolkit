import { EmptyFeatureResult } from '@ngrx/signals';

export type WithStorageSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    clearStorage(): Promise<void>;
    readFromStorage(): Promise<void>;
    writeToStorage(): Promise<void>;
  };
};

export const PROMISE_NOOP = () => Promise.resolve();
