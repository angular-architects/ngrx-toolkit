import { StorageServiceFactory } from '../internal/storage.service';
import { SessionStorageService } from '../internal/session-storage.service';

export const withSessionStorage: () => StorageServiceFactory = () => {
  return () => SessionStorageService;
};
