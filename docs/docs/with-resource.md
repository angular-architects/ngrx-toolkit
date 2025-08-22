---
title: withResource()
---

```typescript
import { withResource } from '@angular-architects/ngrx-toolkit';
```

> **⚠️ Important Note**: This extension is very likely to land in NgRx once Angular's `Resource` enters developer preview. The `withResource` extension provides early access to this functionality and will be maintained for compatibility until the official NgRx implementation is available.

`withResource()` is a feature in NgRx SignalStore that connects Angular's Resource API with the store.
The idea: you can use a store to directly manage async data (like loading from an API), and `withResource()` helps you wire that in.

There are two flavors on how you can use it.

**1. Single Resource flavor**

- The Store implements the type `Resource<T>`.
- That means the store itself exposes the standard resource properties and methods:
  - `value()`, `status()`, `error()`, `hasValue`, etc.

**2. Named Resources flavor**

- Instead of making the whole store act as a single resource, you can define multiple named resources within the same store.
- Each resource gets its own name, which is used as a prefix for all its properties and methods.
- For example, if you define a resource named `users`, the store will provide:
  - `usersValue()`, `usersStatus()`, `usersError()`, `usersHasValue()`

For named resources, there’s an extra option: you can map them back into the Resource type.
This is useful if you want to treat just that part as a “normal” Angular Resource again — for example, to pass it into a component that expects a `Resource<T>`.

## Basic Usage

The extension supports both single resource integration and multiple named resources, giving you flexibility in how you structure your async data management.

### Single Resource

```typescript
import { withResource } from '@angular-architects/ngrx-toolkit';
import { signalStore, withState } from '@ngrx/signals';
import { httpResource } from '@angular/core';

export const UserStore = signalStore(
  withState({ userId: 1 }),
  withResource((state) => httpResource(() => `/user/${state.userId}`)),
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
  withState({ userId: undefined as number | undefined }),
  withResource(({ userId }) => ({
    list: httpResource<User[]>(() => '/users', { defaultValue: [] }),
    detail: httpResource<User>(() => (userId === undefined ? undefined : `/user/${userId}`)),
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

## Choosing Between Single and Multiple Resources

- **Single resource:** use when your store works with just one data source.
- **Named resources:** use when your store is larger and manages multiple entities or async operations.

## Component Usage

```typescript
@Component({
  selector: 'app-user-detail',
  template: `
    @if (userStore.isLoading()) {
      <div>Loading...</div>
    } @else if (userStore.error()) {
      <p>An error has happened.</p>
    } @else if (userStore.hasValue()) {
      <h2>{{ userStore.value().name }}</h2>
      <p>{{ userStore.value().email }}</p>
    }
  `,
})
export class UserDetail {
  protected readonly userStore = inject(UserStore);
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
