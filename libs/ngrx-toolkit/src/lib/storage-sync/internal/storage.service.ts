import { inject, Injectable } from '@angular/core';
import { IndexedDBService } from './indexeddb.service';

export type IndexedDBConfig = {
  storageType: 'indexedDB';
  dbName: string;
  storeName: string;
};

export type StorageConfig = {
  storageType: 'localStorage' | 'sessionStorage';
  key: string;
};

export type Config = IndexedDBConfig | StorageConfig;

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly indexedDB = inject(IndexedDBService);

  // get item from storage(localStorage, sessionStorage, indexedDB)
  async getItem(config: Config): Promise<string | null> {
    if (config.storageType === 'indexedDB') {
      const { dbName, storeName } = config;

      return await this.indexedDB.read(dbName, storeName);
    }

    return window[config.storageType].getItem(config.key);
  }

  // set item in storage(localStorage, sessionStorage, indexedDB)
  async setItem(config: Config, value: string): Promise<void> {
    if (config.storageType === 'indexedDB') {
      const { dbName, storeName } = config;
      return await this.indexedDB.write(dbName, storeName, value);
    }

    return window[config.storageType].setItem(config.key, value);
  }

  // remove item from storage(localStorage, sessionStorage, indexedDB)
  async clear(config: Config): Promise<void> {
    if (config.storageType === 'indexedDB') {
      const { dbName, storeName } = config;

      return await this.indexedDB.clear(dbName, storeName);
    }

    return window[config.storageType].removeItem(config.key);
  }
}
