import { StorageServiceFactory } from '../internal/storage.service';
import { LocalStorageService } from '../internal/local-storage.service';

export const withLocalStorage: () => StorageServiceFactory = () => {
  return () => LocalStorageService;
};
