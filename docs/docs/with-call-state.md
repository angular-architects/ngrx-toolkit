---
title: withCallState()
---

```typescript
import { withCallState } from '@angular-architects/ngrx-toolkit';
```

`withCallState` adds call state management capabilities to NgRx signal stores, tracking the status of asynchronous operations with built-in states for loading, loaded, and error conditions.

## Basic Usage

The simplest way to use `withCallState` is without any configuration:

```typescript
export const TodosStore = signalStore(
  withCallState(),
  // ... other features
);
```

This provides you with:
- A `callState` state property of type `'init' | 'loading' | 'loaded' | { error: string }`
- Computed signals: `loading`, `loaded`, and `error`
- Helper methods: `setLoading()`, `setLoaded()`, and `setError()`

Example usage:

```typescript
export class TodosComponent {
  store = inject(TodosStore);

  loadTodos() {
    this.store.setLoading(); // callState = 'loading'
    try {
      // ... fetch todos
      this.store.setLoaded(); // callState = 'loaded'
    } catch (error) {
      this.store.setError(error); // callState = { error: 'error message' }
    }
  }
}
```

## Use Cases

- Track **loading states** for async operations
- Handle **error states** consistently
- Manage multiple **named collections** of call states

## Type Constraints

The call state can be one of these types:
- `'init'` - Initial state
- `'loading'` - Operation in progress
- `'loaded'` - Operation completed successfully
- `{ error: string }` - Operation failed with error

## Usage

```typescript
import { withCallState } from '@angular-architects/ngrx-toolkit';

const store = signalStore(
  withCallState(),
  withMethods((store) => ({
    async loadData() {
      store.setLoading();
      try {
        // ... async operation
        store.setLoaded();
      } catch (error) {
        store.setError(error);
      }
    }
  }))
);
```

### Named Collection

You can track state for a specific collection by providing a collection name:

```typescript
export const TodosStore = signalStore(
  withCallState({ collection: 'todos' }),
  // ... other features
);
```

This provides:
- A `todosCallState` state property
- Computed signals: `todosLoading`, `todosLoaded`, and `todosError`
- Helper methods with optional collection parameter

```typescript
const store = signalStore(
  withCallState({ collection: 'todos' }),
  withMethods((store) => ({
    async loadTodos() {
      store.todosSetLoading();
      try {
        // ... load todos
        store.todosSetLoaded();
      } catch (error) {
        store.todosSetError(error);
      }
    }
  }))
);
```

### Multiple Collections

For managing multiple async operations, use the collections configuration:

```typescript
export const TodosStore = signalStore(
  withCallState({ collections: ['todos', 'categories'] }),
  // ... other features
);
```

This creates separate states and signals for each collection:
- States: `todosCallState`, `categoriesCallState`
- Signals: `todosLoading`, `todosLoaded`, `todosError`, `categoriesLoading`, etc.

```typescript
const store = signalStore(
  withCallState({ collections: ['todos', 'users'] }),
  withMethods((store) => ({
    async loadAll() {
      store.todosSetLoading();
      store.usersSetLoading();
      // ... load data for both collections
    }
  }))
);
```

## Helper Methods

### setLoading()
Sets the call state to 'loading':
```typescript
store.setLoading(); // Basic usage
store.setLoading('todos'); // With collection
```

### setLoaded()
Sets the call state to 'loaded':
```typescript
store.setLoaded(); // Basic usage
store.setLoaded('todos'); // With collection
```

### setError()
Sets the call state to error with a message:
```typescript
store.setError(error); // Basic usage
store.setError(error, 'todos'); // With collection
```

## Accessing State

Access the computed signals in your templates or component code:

```typescript
@Component({
  template: `
    @if (store.loading()) {
      <div>Loading...</div>
    }
    @if (store.error()) {
      <div>Error: {{ store.error() }}</div>
    }
    @if (store.loaded()) {
      <div>Content loaded!</div>
    }
  `
})
export class MyComponent {
  store = inject(MyStore);
}
```

For collections:
```typescript
@Component({
  template: `
   @if (store.todosLoading()) {
     <div>Loading todos...</div>
   }
   @if (store.categoriesLoading()) {
     <div>Loading categories...</div>
   }
  `
})