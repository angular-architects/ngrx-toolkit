import { Injectable } from '@angular/core';

export const dbName: string = 'ngrxToolkit' as const;

export const keyPath: string = 'ngrxToolkitId' as const;

export const VERSION: number = 1 as const;

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  /**
   * open indexedDB
   * @param storeName
   */
  private async openDB(storeName: string): Promise<IDBDatabase> {
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

  /**
   * write to indexedDB
   * @param storeName
   * @param data
   */
  async setItem(storeName: string, data: string): Promise<void> {
    const db = await this.openDB(storeName);

    const tx = db.transaction(storeName, 'readwrite');

    const store = tx.objectStore(storeName);

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
   * @param storeName
   */
  async getItem<T>(storeName: string): Promise<T> {
    const db = await this.openDB(storeName);

    const tx = db.transaction(storeName, 'readonly');

    const store = tx.objectStore(storeName);

    const request = store.get(keyPath);

    return new Promise((resolve, reject) => {
      request.onsuccess = (): void => {
        db.close();
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
   * @param storeName
   * @returns
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.openDB(storeName);

    const tx = db.transaction(storeName, 'readwrite');

    const store = tx.objectStore(storeName);

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
}
