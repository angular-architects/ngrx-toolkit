import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

export const keyPath: string = 'ngrxToolkitId' as const;

export const VERSION: number = 1 as const;

@Injectable({ providedIn: 'root' })
export class IndexedDBService implements StorageService {
  /**
   * write to indexedDB
   * @param storeAndDbName
   * @param data
   */
  async setItem(storeAndDbName: string, data: string): Promise<void> {
    const db = await this.openDB(storeAndDbName);

    const tx = db.transaction(storeAndDbName, 'readwrite');

    const store = tx.objectStore(storeAndDbName);

    store.put({
      [keyPath]: keyPath,
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
   * @param storeAndDbName
   */
  async getItem(storeAndDbName: string): Promise<string | null> {
    const db = await this.openDB(storeAndDbName);

    const tx = db.transaction(storeAndDbName, 'readonly');

    const store = tx.objectStore(storeAndDbName);

    const request = store.get(keyPath);

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
   * @param storeAndDbName
   * @returns
   */
  async clear(storeAndDbName: string): Promise<void> {
    const db = await this.openDB(storeAndDbName);

    const tx = db.transaction(storeAndDbName, 'readwrite');

    const store = tx.objectStore(storeAndDbName);

    const request = store.delete(keyPath);

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

  /**
   * open indexedDB
   * @param storeAndDbName
   */
  private async openDB(storeAndDbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(storeAndDbName, VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(storeAndDbName)) {
          db.createObjectStore(storeAndDbName, { keyPath });
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
