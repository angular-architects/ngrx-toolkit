import { inject, Injectable } from '@angular/core';
import { IndexedDBService } from './indexeddb.service';

// export type Config = {
//   storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
//   key?: string;
//   dbName?: string;
//   storeName?: string;
// };

export type IndexedDBConfig = {
  storage: 'indexedDB';
  dbName: string;
  storeName: string;
};

export type StorageConfig = {
  storage: 'localStorage' | 'sessionStorage';
  key: string;
};

export type Config = IndexedDBConfig | StorageConfig;

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly indexedDB = inject(IndexedDBService);

  private storage: Storage | null = null;

  setStorage(storage: Storage): void {
    this.storage = storage;
  }

  // get item from storage(localStorage, sessionStorage, indexedDB)
  async getItem(config: Config): Promise<string | null> {
    if (config.storage === 'indexedDB') {
      const { dbName, storeName } = config;

      return await this.indexedDB.read(dbName, storeName);
    }

    if (this.storage === null) {
      throw new Error('Storage not set');
    }
    return this.storage.getItem(config.key);
  }

  // set item in storage(localStorage, sessionStorage, indexedDB)
  async setItem(config: Config, value: string): Promise<void> {
    if (config.storage === 'indexedDB') {
      const { dbName, storeName } = config;
      return await this.indexedDB.write(dbName, storeName, value);
    }

    if (this.storage === null) {
      throw new Error('Storage not set');
    }

    return this.storage.setItem(config.key, value);
  }

  // remove item from storage(localStorage, sessionStorage, indexedDB)
  async removeItem(config: Config): Promise<void> {
    if (config.storage === 'indexedDB') {
      const { dbName, storeName } = config;

      return await this.indexedDB.clear(dbName, storeName);
    }

    if (this.storage === null) {
      throw new Error('Storage not set');
    }

    return this.storage.removeItem(config.key);
  }
}
