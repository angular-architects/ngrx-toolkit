import {
  EmptyFeatureResult,
  getState,
  patchState,
  SignalStoreFeature,
  signalStoreFeature,
  SignalStoreFeatureResult,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import { effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

const keyPath: string = 'ngrxToolkitId' as const;

const PROMISE_NOOP = () => Promise.resolve();

type WithIndexedDBSyncFeatureResult = EmptyFeatureResult & {
  methods: {
    readFromIndexedDB(): Promise<void>;

    writeToIndexedDB(): Promise<void>;

    clearIndexedDB(): Promise<void>;
  };
};

const withIndexedDBSyncFeatureStub: Pick<
  WithIndexedDBSyncFeatureResult,
  'methods'
>['methods'] = {
  readFromIndexedDB: PROMISE_NOOP,
  writeToIndexedDB: PROMISE_NOOP,
  clearIndexedDB: PROMISE_NOOP,
};

export type IndexedDBSyncConfig = {
  /**
   * en: indexedDB name
   * ja: indexedDBのデータベース名
   */
  dbName: string;

  /**
   * en: indexedDB store name
   * ja: indexedDBのストア名
   */
  storeName: string;

  /**
   * en: flag indicating if the store should read from indexedDB on init and write to indexedDB on every state change.
   * ja: 初期化時にindexedDBから読み込み、状態が変更されるたびにindexedDBに書き込むかどうかを示すフラグ
   */
  autoSync?: boolean;
};

export function withIndexeddb<
  State extends object,
  Input extends SignalStoreFeatureResult
>({
  dbName,
  storeName,
  autoSync = true,
}: IndexedDBSyncConfig): SignalStoreFeature<
  Input,
  WithIndexedDBSyncFeatureResult
> {
  return signalStoreFeature(
    withMethods((store, platformId = inject(PLATFORM_ID)) => {
      if (isPlatformServer(platformId)) {
        return withIndexedDBSyncFeatureStub;
      }

      return {
        async readFromIndexedDB(): Promise<void> {
          const dbState = (await readFromIndexedDB(dbName, storeName)) as
            | {
                keyPath: string;
                value: State;
              }
            | undefined;

          // en:do nothing if there is no value in db
          if (dbState === undefined) {
            return;
          }

          patchState(store, dbState.value);
        },

        async writeToIndexedDB(): Promise<void> {
          const state = getState(store) as State;

          await writeToIndexedDB(dbName, storeName, {
            [keyPath]: keyPath,
            value: state,
          });
        },

        async clearIndexedDB(): Promise<void> {
          await clearIndexedDB(dbName, storeName);
        },
      };
    }),
    withHooks((store) => ({
      onInit(): void {
        if (!autoSync) return;

        Promise.resolve().then(async () => {
          await store.readFromIndexedDB();
        });

        effect(() =>
          ((_) => {
            Promise.resolve().then(async () => {
              await store.writeToIndexedDB();
            });
          })(getState(store))
        );
      },
    }))
  );
}

/**
 * open indexedDB
 * @param dbName
 * @param storeName
 * @param version
 */
export async function openDB(
  dbName: string,
  storeName: string,
  version: number | undefined = 1
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath });
      }
    };

    request.onsuccess = (): void => {
      resolve(request.result);
    };

    request.onerror = (): void => {
      reject(request.error);
    };
  });
}

/**
 * write to indexedDB
 * @param dbName
 * @param storeName
 * @param data
 */
export async function writeToIndexedDB<T>(
  dbName: string,
  storeName: string,
  data: T
): Promise<void> {
  const db = await openDB(dbName, storeName);

  const tx = db.transaction(storeName, 'readwrite');

  const store = tx.objectStore(storeName);

  store.put(data);

  return new Promise((resolve, reject) => {
    tx.oncomplete = (): void => {
      db.close();
      resolve();
    };

    tx.onerror = (): void => {
      db.close();
      reject();
    };
  });
}

/**
 * read from indexedDB
 * @param dbName
 * @param storeName
 */
export async function readFromIndexedDB<T>(
  dbName: string,
  storeName: string
): Promise<T> {
  const db = await openDB(dbName, storeName);

  const tx = db.transaction(storeName, 'readonly');

  const store = tx.objectStore(storeName);

  const request = store.get(keyPath);

  return new Promise((resolve, reject) => {
    request.onsuccess = (): void => {
      db.close();
      resolve(request.result);
    };

    request.onerror = (): void => {
      db.close();
      reject();
    };
  });
}

/**
 * delete indexedDB
 * @param dbName
 * @param storeName
 * @returns
 */
export async function clearIndexedDB(
  dbName: string,
  storeName: string
): Promise<void> {
  const db = await openDB(dbName, storeName);

  const tx = db.transaction(storeName, 'readwrite');

  const store = tx.objectStore(storeName);

  const request = store.delete(keyPath);

  return new Promise((resolve, reject) => {
    request.onsuccess = (): void => {
      db.close();
      resolve();
    };

    request.onerror = (): void => {
      db.close();
      reject();
    };
  });
}
