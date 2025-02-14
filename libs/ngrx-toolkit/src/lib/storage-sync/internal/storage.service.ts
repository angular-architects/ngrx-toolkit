import { Type } from '@angular/core';

export interface StorageService {
  clear(key: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, data: string): Promise<void>;
}

export type StorageServiceFactory = () => Type<StorageService>;
