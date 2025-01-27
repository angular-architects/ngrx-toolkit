import { inject, Injectable } from '@angular/core';
import { IndexedDBService } from './indexeddb.service';

export type StorageType = 'localStorage' | 'sessionStorage';

export type IndexedDBConfig = {
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
  async getItem(key: string): Promise<string | null>;
  async getItem(config: IndexedDBConfig): Promise<string | null>;

  async getItem(configOrKey: IndexedDBConfig | string): Promise<string | null> {
    if (typeof configOrKey === 'string') {
      if (this.storage === null) {
        throw new Error('Storage not set');
      }

      return this.storage.getItem(configOrKey);
    }

    const { dbName, storeName } = configOrKey;

    if (dbName === undefined || storeName === undefined) {
      throw new Error('dbName and storeName must be set');
    }

    return await this.indexedDB.read(dbName, storeName);
  }

  // set item in storage(localStorage, sessionStorage, indexedDB)
  async setItem(key: string, value: string): Promise<void>;
  async setItem(config: IndexedDBConfig, value: string): Promise<void>;

  async setItem(
    configOrKey: IndexedDBConfig | string,
    value: string
  ): Promise<void> {
    if (typeof configOrKey === 'string') {
      if (this.storage === null) {
        throw new Error('Storage not set');
      }

      this.storage.setItem(configOrKey, value);
      return;
    }

    const { dbName, storeName } = configOrKey;

    if (dbName === undefined || storeName === undefined) {
      throw new Error('dbName and storeName must be set');
    }

    await this.indexedDB.write(dbName, storeName, value);
  }
  //
  // // remove item from storage(localStorage, sessionStorage, indexedDB)
  async removeItem(key: string): Promise<void>;
  async removeItem(config: IndexedDBConfig): Promise<void>;

  async removeItem(configOrKey: IndexedDBConfig | string): Promise<void> {
    if (typeof configOrKey === 'string') {
      if (this.storage === null) {
        throw new Error('Storage not set');
      }
      this.storage.removeItem(configOrKey);
      return;
    }

    const { dbName, storeName } = configOrKey;

    if (dbName === undefined || storeName === undefined) {
      throw new Error('dbName and storeName must be set');
    }

    return await this.indexedDB.clear(dbName, storeName);
  }
}
