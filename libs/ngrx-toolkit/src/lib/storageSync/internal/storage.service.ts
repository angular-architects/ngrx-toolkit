import { inject, Injectable } from '@angular/core';
import { IndexedDBService } from './indexeddb.service';

export type IndexedDBConfig = {
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
  key?: string;
  dbName?: string;
  storeName?: string;
};

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
  async getItem(config: IndexedDBConfig): Promise<string | null>;

  async getItem(config: IndexedDBConfig): Promise<string | null> {
    if (config.storage === 'indexedDB') {
      const { dbName, storeName } = config;

      if (dbName === undefined || storeName === undefined) {
        throw new Error('dbName and storeName must be set');
      }

      return await this.indexedDB.read(dbName, storeName);
    }

    if (this.storage === null) {
      throw new Error('Storage not set');
    }

    if (config.key === undefined) {
      throw new Error('key is undefined');
    }

    return this.storage.getItem(config.key);
  }

  // set item in storage(localStorage, sessionStorage, indexedDB)
  async setItem(config: IndexedDBConfig, value: string): Promise<void>;

  async setItem(config: IndexedDBConfig, value: string): Promise<void> {
    if (config.storage === 'indexedDB') {
      const { dbName, storeName } = config;

      if (dbName === undefined || storeName === undefined) {
        throw new Error('dbName and storeName must be set');
      }

      return await this.indexedDB.write(dbName, storeName, value);
    }

    if (this.storage === null) {
      throw new Error('Storage not set');
    }

    if (config.key === undefined) {
      throw new Error('key is undefined');
    }

    return this.storage.setItem(config.key, value);
  }
  //
  // // remove item from storage(localStorage, sessionStorage, indexedDB)
  async removeItem(config: IndexedDBConfig): Promise<void>;

  async removeItem(config: IndexedDBConfig): Promise<void> {
    if (config.storage === 'indexedDB') {
      const { dbName, storeName } = config;

      if (dbName === undefined || storeName === undefined) {
        throw new Error('dbName and storeName must be set');
      }

      return await this.indexedDB.clear(dbName, storeName);
    }

    if (this.storage === null) {
      throw new Error('Storage not set');
    }

    if (config.key === undefined) {
      throw new Error('key is undefined');
    }

    return this.storage.removeItem(config.key);
  }
}
