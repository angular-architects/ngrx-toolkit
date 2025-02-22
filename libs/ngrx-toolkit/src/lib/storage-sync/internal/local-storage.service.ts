import { Injectable } from '@angular/core';
import { NOOP, StorageService, WithStorageSyncFeatureResult } from './models';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService implements StorageService {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, data: string): void {
    return localStorage.setItem(key, data);
  }

  clear(key: string): void {
    return localStorage.removeItem(key);
  }

  /** return stub */
  getStub(): Pick<WithStorageSyncFeatureResult, 'methods'>['methods'] {
    return {
      clearStorage: NOOP,
      readFromStorage: NOOP,
      writeToStorage: NOOP,
    };
  }
}
