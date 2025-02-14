import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService implements StorageService {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, data: string): Promise<void> {
    return localStorage.setItem(key, data);
  }

  async clear(key: string): Promise<void> {
    return localStorage.removeItem(key);
  }
}
