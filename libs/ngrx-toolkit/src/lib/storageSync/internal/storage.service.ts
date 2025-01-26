import { inject, Injectable } from '@angular/core';
import { IndexedDBService } from './indexeddb.service';

export type StorageType = 'localStorage' | 'sessionStorage';

export type StorageOptions = {
  dbName: string;
  storeName: string;
};

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly indexedDB = inject(IndexedDBService);

  // get item from storage(localStorage, sessionStorage, indexedDB)
  async getItem(type: StorageType): Promise<string | null>;
  async getItem(options: StorageOptions): Promise<string | null>;

  async getItem(
    configOrKey: StorageOptions | StorageType
  ): Promise<string | null> {
    if (typeof configOrKey === 'string') {
      return window[configOrKey].getItem(configOrKey);
    }

    const { dbName, storeName } = configOrKey;

    return await this.indexedDB.read(dbName, storeName);
  }

  // set item in storage(localStorage, sessionStorage, indexedDB)
  async setItem(type: StorageType, value: string): Promise<void>;
  async setItem(options: StorageOptions, value: string): Promise<void>;

  async setItem(
    configOrKey: StorageOptions | StorageType,
    value: string
  ): Promise<void> {
    if (typeof configOrKey === 'string') {
      window[configOrKey].setItem(configOrKey, value);
      return;
    }

    const { dbName, storeName } = configOrKey;
    await this.indexedDB.write(dbName, storeName, value);
  }

  // remove item from storage(localStorage, sessionStorage, indexedDB)
  async removeItem(type: StorageType): Promise<void>;
  async removeItem(options: StorageOptions): Promise<void>;

  async removeItem(configOrKey: StorageOptions | StorageType): Promise<void> {
    if (typeof configOrKey === 'string') {
      window[configOrKey].removeItem(configOrKey);
      return;
    }

    const { dbName, storeName } = configOrKey;
    return await this.indexedDB.clear(dbName, storeName);
  }
}
