---
title: withStorageSync()
---

`withStorageSync` adds automatic or manual synchronization with Web Storage (`localstorage`/`sessionstorage`).

:::warning
As Web Storage only works in browser environments it will fallback to a stub implementation on server environments.
:::

Example:

```typescript
const SyncStore = signalStore(
  withStorageSync<User>({
    key: 'synced', // key used when writing to/reading from storage
    autoSync: false, // read from storage on init and write on state changes - `true` by default
    select: (state: User) => Partial<User>, // projection to keep specific slices in sync
    parse: (stateString: string) => State, // custom parsing from storage - `JSON.parse` by default
    stringify: (state: User) => string, // custom stringification - `JSON.stringify` by default
    storage: () => sessionstorage, // factory to select storage to sync with
  })
);
```

```typescript
@Component(...)
public class SyncedStoreComponent {
  private syncStore = inject(SyncStore);

  updateFromStorage(): void {
    this.syncStore.readFromStorage(); // reads the stored item from storage and patches the state
  }

  updateStorage(): void {
    this.syncStore.writeToStorage(); // writes the current state to storage
  }

  clearStorage(): void {
    this.syncStore.clearStorage(); // clears the stored item in storage
  }
}
```
## Injecting services
The `storage` property requires a factory function that returns a `Storage` implementation. If you have a custom `Storage` implementation that is `Injectable`, you can provide it as a factory parameters using the `inject` function.

 Example:
 
 ```typescript
@Injectable({providedIn: 'root'})
export class MyStorage implements Storage {
    [name: string]: any;
    length: number;
    clear(): void {
        ...
    }
    getItem(key: string): string | null {
        ...
    }
    key(index: number): string | null {
        ...
    }
    removeItem(key: string): void {
        ...
    }
    setItem(key: string, value: string): void {
        ...
    }

}
 ```

 ```typescript
const SyncStore = signalStore(
  withStorageSync<User>({
    storage: (myStorageImplementation = inject(MyStorage)) => myStorageImplementation,
  })
);
```
