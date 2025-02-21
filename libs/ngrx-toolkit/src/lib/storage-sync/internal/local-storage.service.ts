import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { PROMISE_NOOP, WithStorageSyncFeatureResult } from './models';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService implements StorageService {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, data: string): Promise<void> {
    return localStorage.setItem(key, data);
  }

  async clear(key: string): Promise<void> {
    return localStorage.removeItem(key);
  }

  /** return stub */
  getStub(): Pick<WithStorageSyncFeatureResult, 'methods'>['methods'] {
    return {
      clearStorage: PROMISE_NOOP,
      readFromStorage: PROMISE_NOOP,
      writeToStorage: PROMISE_NOOP,
    };
  }
}
