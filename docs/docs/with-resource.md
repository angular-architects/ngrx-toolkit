---
title: withResource()
---

```typescript
import { withResource } from '@angular-architects/ngrx-toolkit';
```

> **⚠️ Important Note**: This extension is very likely to land in NgRx once Angular's `Resource` gets developer preview. The `withResource` extension provides early access to this functionality and will be maintained for compatibility until the official NgRx implementation is available.

`withResource()` integrates Angular's `Resource` into SignalStore and makes the store instance implement the `Resource` interface. This extension is particularly useful for managing asynchronous data operations like HTTP requests, file operations, or any other resource-based operations.

## Basic Usage

### Single Resource

```typescript
import { withResource } from '@angular-architects/ngrx-toolkit';
import { signalStore, withState } from '@ngrx/signals';
import { httpResource } from '@angular/core';

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState({ userId: undefined as number | undefined }),
  withResource(({ userId }) => httpResource<User>(() => (userId === undefined ? undefined : `/users/${userId}`))),
);
```

The store now provides:

- `value()`: The resource's current value
- `status()`: The resource's current status
- `error()`: Any error that occurred
- `isLoading()`: Whether the resource is currently loading
- `hasValue()`: Type guard to check if the resource has a value
- `_reload()`: Method to reload the resource

### Multiple Named Resources

```typescript
export const UserStore = signalStore(
  { providedIn: 'root' },
  withState({ userId: undefined as number | undefined }),
  withResource(({ userId }) => ({
    list: httpResource<User[]>(() => '/users', { defaultValue: [] }),
    detail: httpResource<User>(() => (userId === undefined ? undefined : `/users/${userId}`)),
  })),
);
```

With named resources, each resource gets prefixed properties:

- `listValue()`, `detailValue()`: Resource values
- `listStatus()`, `detailStatus()`: Resource statuses
- `listError()`, `detailError()`: Resource errors
- `listIsLoading()`, `detailIsLoading()`: Loading states
- `listHasValue()`, `detailHasValue()`: Type guards
- `_listReload()`, `_detailReload()`: Reload methods

## Component Usage

```typescript
@Component({
  selector: 'app-user-detail',
  template: `
    <div *ngIf="userStore.isLoading()">Loading...</div>
    <div *ngIf="userStore.error() as error">Error: {{ error.message }}</div>
    <div *ngIf="userStore.hasValue()">
      <h2>{{ userStore.value()?.name }}</h2>
      <p>{{ userStore.value()?.email }}</p>
    </div>
    <button (click)="reload()">Reload</button>
  `,
})
export class UserDetailComponent {
  private userStore = inject(UserStore);

  get user() {
    return this.store.value();
  }

  reload(): void {
    this.userStore._reload();
  }
}
```

## Resource Mapping

For named resources, you can use the `mapToResource` utility to get a properly typed `Resource<T>`:

```typescript
import { mapToResource } from '@angular-architects/ngrx-toolkit';

const store = signalStore(
  withState({ userId: undefined as number | undefined }),
  withResource(({ userId }) => ({
    user: httpResource<User>(() => (userId === undefined ? undefined : `/users/${userId}`)),
  })),
);

const userResource = mapToResource(store, 'user');
// userResource now satisfies Resource<User>
```

## Integration with Other Features

`withResource` works seamlessly with other NgRx Toolkit features:

```typescript
export const FlightStore = signalStore(
  { providedIn: 'root' },
  withState({ searchCriteria: { from: '', to: '' } }),
  withResource(({ searchCriteria }) => ({
    flights: httpResource<Flight[]>(() => (searchCriteria.from && searchCriteria.to ? `/flights?from=${searchCriteria.from}&to=${searchCriteria.to}` : undefined)),
  })),
  withCallState(),
  withUndoRedo(),
);
```

## Type Safety

The extension provides full TypeScript support with proper type inference:

```typescript
// Single resource
const store = signalStore(withResource(() => httpResource<User>('/user')));
// store.value() is typed as Signal<User | undefined>

// Named resources
const store = signalStore(
  withResource(() => ({
    user: httpResource<User>('/user'),
    posts: httpResource<Post[]>('/posts'),
  })),
);
// store.userValue() is typed as Signal<User | undefined>
// store.postsValue() is typed as Signal<Post[] | undefined>
```

## When to Use

Use `withResource` when you need to:

- Manage asynchronous data operations in your store
- Handle loading states, errors, and data values in a unified way
- Integrate with Angular's Resource system
- Build reactive data flows that automatically update based on dependencies

## Migration Path

When NgRx officially releases their `withResource` implementation, migration should be straightforward as the API is designed to be compatible. The main changes will likely be:

1. Import from `@ngrx/signals` instead of `@angular-architects/ngrx-toolkit`
2. Update any type imports if they change
3. Test functionality to ensure compatibility

## API Reference

### `withResource(resourceFactory)`

**Parameters:**

- `resourceFactory`: A function that receives the store's state signals, methods, and props, and returns either a `ResourceRef<T>` or a `Record<string, ResourceRef<unknown>>`

**Returns:**

- A `SignalStoreFeature` that integrates the resource(s) into the store

### `mapToResource(store, name)`

**Parameters:**

- `store`: The store instance containing the named resource
- `name`: The name of the resource to map

**Returns:**

- A properly typed `Resource<T>` object
