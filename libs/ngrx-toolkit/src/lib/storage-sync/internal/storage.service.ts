import { WithStorageSyncFeatureResult } from './models';

export interface StorageService {
  clear(key: string): Promise<void> | void;

  getItem(key: string): Promise<string | null> | string | null;

  setItem(key: string, data: string): Promise<void> | void;

  getStub(): Pick<WithStorageSyncFeatureResult, 'methods'>['methods'];
}
