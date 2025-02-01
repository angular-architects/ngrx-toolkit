import { Injectable } from '@angular/core';

export const keyPath: string = 'ngrxToolkitId' as const;

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  /**
   * open indexedDB
   * @param dbName
   * @param storeName
   * @param version
   */
  private async openDB(
    dbName: string,
    storeName: string,
    version: number | undefined = 1
  ): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

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
   * @param dbName
   * @param storeName
   * @param data
   */
  async write(dbName: string, storeName: string, data: string): Promise<void> {
    const db = await this.openDB(dbName, storeName);

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
   * @param dbName
   * @param storeName
   */
  async read<T>(dbName: string, storeName: string): Promise<T> {
    const db = await this.openDB(dbName, storeName);

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
   * @param dbName
   * @param storeName
   * @returns
   */
  async clear(dbName: string, storeName: string): Promise<void> {
    const db = await this.openDB(dbName, storeName);

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
