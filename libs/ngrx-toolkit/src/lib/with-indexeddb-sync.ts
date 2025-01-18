import {
  getState,
  patchState,
  signalStoreFeature,
  withHooks,
  withMethods,
} from '@ngrx/signals';
import { effect } from '@angular/core';

const keyPath: string = 'ngrxToolkitId' as const;

export function withIndexeddbSync<State extends object>() {
  return signalStoreFeature(
    withMethods((store) => {
      return {
        async readFromIndexedDB(): Promise<void> {
          const db = (await readFromIndexedDB(
            'ngrx-toolkit',
            'test-store'
          )) as { keyPath: string; value: State };

          console.log('db', db);

          patchState(store, db.value);
        },

        async writeToIndexedDB(): Promise<void> {
          const state = getState(store) as State;

          await writeToIndexedDB('ngrx-toolkit', 'test-store', {
            [keyPath]: keyPath,
            value: state,
          });
        },
      };
    }),
    withHooks((store) => ({
      onInit(): void {
        Promise.resolve().then(async () => {
          await store.readFromIndexedDB();
        });

        // effect(() => {
        //
        //   Promise.resolve().then(async () => {
        //     await store.writeToIndexedDB();
        //   });
        //
        // });

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
