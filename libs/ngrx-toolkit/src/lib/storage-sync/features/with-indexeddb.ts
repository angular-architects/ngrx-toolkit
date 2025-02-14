import { IndexedDBService } from '../internal/indexeddb.service';
import { StorageServiceFactory } from '../internal/storage.service';

export const withIndexeddb: () => StorageServiceFactory = () => {
  return () => IndexedDBService;
};
