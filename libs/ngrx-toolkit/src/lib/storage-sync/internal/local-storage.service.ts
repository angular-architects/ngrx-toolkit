import { Injectable } from '@angular/core';
import {} from './models';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, data: string): void {
    return localStorage.setItem(key, data);
  }

  clear(key: string): void {
    return localStorage.removeItem(key);
  }
}
