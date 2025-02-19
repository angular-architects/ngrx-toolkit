import { Type } from '@angular/core';
import { WithStorageSyncFeatureResult } from './models';

export interface StorageService {
  clear(key: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, data: string): Promise<void>;
  getStub(): Pick<WithStorageSyncFeatureResult, 'methods'>['methods'];
}

export type StorageServiceFactory = Type<StorageService>;
