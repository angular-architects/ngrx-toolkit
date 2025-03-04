import { Injectable } from '@angular/core';
import {
  IndexeddbService,
  PROMISE_NOOP,
  WithIndexeddbSyncFeatureResult,
} from './models';

export const keyPath = 'ngrxToolkitKeyPath';

export const dbName = 'ngrxToolkitDb';

export const storeName = 'ngrxToolkitStore';

export const VERSION: number = 1 as const;

@Injectable({ providedIn: 'root' })
export class IndexedDBService implements IndexeddbService {
  /**
   * write to indexedDB
   * @param key
   * @param data
   */
  async setItem(key: string, data: string): Promise<void> {
    const db = await this.openDB();

    const tx = db.transaction(storeName, 'readwrite');

    const store = tx.objectStore(storeName);

    store.put({
      [keyPath]: key,
      value: data,
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = (): void => {
        db.close();
        resolve();
      };

      tx.onerror = (): void => {
        db.close();
        reject();
      };
    });
  }

  /**
   * read from indexedDB
   * @param key
   */
  async getItem(key: string): Promise<string | null> {
    const db = await this.openDB();

    const tx = db.transaction(storeName, 'readonly');

    const store = tx.objectStore(storeName);

    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = (): void => {
        db.close();
        // localStorage(sessionStorage) returns null if the key does not exist
        // Similarly, indexedDB should return null
        if (request.result === undefined) {
          resolve(null);
        }
        resolve(request.result?.['value']);
      };

      request.onerror = (): void => {
        db.close();
        reject();
      };
    });
  }

  /**
   * delete indexedDB
   * @param key
   */
  async clear(key: string): Promise<void> {
    const db = await this.openDB();

    const tx = db.transaction(storeName, 'readwrite');

    const store = tx.objectStore(storeName);

    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = (): void => {
        db.close();
        resolve();
      };

      request.onerror = (): void => {
        db.close();
        reject();
      };
    });
  }

  /** return stub */
  getStub(): Pick<WithIndexeddbSyncFeatureResult, 'methods'>['methods'] {
    return {
      clearStorage: PROMISE_NOOP,
      readFromStorage: PROMISE_NOOP,
      writeToStorage: PROMISE_NOOP,
    };
  }

  /**
   * open indexedDB
   */
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath });
        }
      };

      request.onsuccess = (): void => {
        resolve(request.result);
      };

      request.onerror = (): void => {
        reject(request.error);
      };
    });
  }
}
