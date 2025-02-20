import { EmptyFeatureResult } from '@ngrx/signals';
import { Type } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { SessionStorageService } from './session-storage.service';
import { IndexedDBService } from './indexeddb.service';

/** localStorage and sessionStorage */
export type WithStorageSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    clearStorage(): void;
    readFromStorage(): void;
    writeToStorage(): void;
  };
};

/** indexedDB */
export type WithIndexeddbStorageSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    clearStorage(): Promise<void>;
    readFromStorage(): Promise<void>;
    writeToStorage(): Promise<void>;
  };
};

export type LocalStorageServiceFactory = Type<LocalStorageService>;

export type SessionStorageServiceFactory = Type<SessionStorageService>;

export type IndexedDBServiceFactory = Type<IndexedDBService>;

export type StorageServiceFactory =
  | LocalStorageServiceFactory
  | SessionStorageServiceFactory
  | IndexedDBServiceFactory;
