import { SessionStorageService } from '../internal/session-storage.service';

export const withSessionStorage = () => {
  return () => SessionStorageService;
};
