import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // get item from storage(localStorage, sessionStorage)
  async getItem(storage: Storage, key: string): Promise<string | null> {
    return storage.getItem(key);
  }

  // set item in storage(localStorage, sessionStorage)
  async setItem(storage: Storage, key: string, value: string): Promise<void> {
    return storage.setItem(key, value);
  }

  // remove item from storage(localStorage, sessionStorage)
  async clear(storage: Storage, key: string): Promise<void> {
    return storage.removeItem(key);
  }
}
