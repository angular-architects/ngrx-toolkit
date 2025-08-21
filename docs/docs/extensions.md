---
title: Extensions
---

The NgRx Toolkit is a set of extensions to the NgRx SignalsStore.

It offers extensions like:

- [⭐️ Devtools](./with-devtools): Integration into Redux Devtools
- [Conditional Features](./with-conditional): Allows adding features to the store conditionally
- [DataService](./with-data-service): Builds on top of `withEntities` and adds the backend synchronization to it
- [Immutable State Protection](./with-immutable-state): Protects the state from being mutated outside or inside the Store.
- [~Redux~](./with-redux): Possibility to use the Redux Pattern. Deprecated in favor of NgRx's `@ngrx/signals/events` starting in 19.2
- [Resource](./with-resource): Integrates Angular's Resource into SignalStore for async data operations
- [Reset](./with-reset): Adds a `resetState` method to your store
- [Call State](./with-call-state): Add call state management to your signal stores
- [Storage Sync](./with-storage-sync): Synchronizes the Store with Web Storage
- [Undo Redo](./with-undo-redo): Adds Undo/Redo functionality to your store

To install it, run

```shell
npm i @angular-architects/ngrx-toolkit
```
