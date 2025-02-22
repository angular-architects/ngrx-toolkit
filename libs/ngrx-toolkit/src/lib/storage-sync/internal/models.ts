import { EmptyFeatureResult } from '@ngrx/signals';
import { Type } from '@angular/core';

export interface StorageService {
  clear(key: string): void;

  getItem(key: string): string | null;

  setItem(key: string, data: string): void;

  getStub(): Pick<WithStorageSyncFeatureResult, 'methods'>['methods'];
}

export interface IndexeddbService {
  clear(key: string): Promise<void>;

  getItem(key: string): Promise<string | null>;

  setItem(key: string, data: string): Promise<void>;

  getStub(): Pick<WithIndexeddbSyncFeatureResult, 'methods'>['methods'];
}

export type StorageServiceFactory =
  | Type<IndexeddbService>
  | Type<StorageService>;

export type WithIndexeddbSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    clearStorage(): Promise<void>;
    readFromStorage(): Promise<void>;
    writeToStorage(): Promise<void>;
  };
};

export type WithStorageSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    clearStorage(): void;
    readFromStorage(): void;
    writeToStorage(): void;
  };
};

export const NOOP = () => void true;

export const PROMISE_NOOP = () => Promise.resolve();
