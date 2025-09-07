---
title: Mutations
---

```typescript
import { httpMutation } from '@angular-architects/ngrx-toolkit';
```

```typescript
import { rxMutation } from '@angular-architects/ngrx-toolkit';
```

```typescript
import { withMutations } from '@angular-architects/ngrx-toolkit';
```

## Basic Usage - Summary

The mutations feature (`withMutations`) and methods (`httpMutation` and `rxMutation`) seek to offer an appropriate equivalent to signal resources for sending data back to the backend. The methods can be used in `withMutations()` or on their own.

Mutations enable the use of the following:

```ts
// 1. In the mutation:`onSuccess` and `onError` callbacks

// 2. Enables the method (returns a promise)
store.increment({...})
store.saveToServer({...})

// 3. Enables the following signal states
store.increment.(value/status/error/isPending/status/hasValue);
```

Usage in `withMutations()`

```ts
  // functions defined in next block
  withMutations((store) => ({
    increment: rxMutation({...}),
    saveToServer: httpMutation<void, CounterResponse>({...}),
  })),
```

Usage as functions, such as a component or service:

```ts
  // function calcSum(a: number, b: number): Observable<number> {...}

  private increment = rxMutation({
    operation: (params: Params) => {
      return calcSum(this.counterSignal(), params.value);
    },
    operator: concatOp,
    onSuccess: (result) => { // optional
      this.counterSignal.set(result);
    },
    onError: (error) => { // optional
      console.error('Error occurred:', error);
    },
  });

  private saveToServer = httpMutation<Params, CounterResponse>({
    request: (p) => ({
      url: `https://httpbin.org/post`,
      method: 'POST',
      body: { counter: p.value },
      headers: { 'Content-Type': 'application/json' },
    }),
    onSuccess: (response) => { // optional
      console.log('Counter sent to server:', response);
    },
    onError: (error) => { // optional
      console.error('Failed to send counter:', error);
    },
  });
```

This guide covers

- Why we do not use `withResource`, and the direction on mutations from the community
- `withMutations` store _feature_, and the usage of `httpMutation` and `rxMutation` inside of the feature
- `httpMutation` and `rxMutation` as standalone _functions_ that can be used outside of a store

But before going into depth of the "How" and "When" to use mutations, it is important to give context about
the "Why" and "Who" of why mutations were built for the toolkit like this.

## Background

### Why not handle mutations using `withResource`?

The `resource` API and discussion about it naturally lead to talks about all async operations.
Notably, one position has been remained firm by the Angular team through resources' debut, RFCs (#1, [Architecture](https://github.com/angular/angular/discussions/60120)) and (#2, [APIs](https://github.com/angular/angular/discussions/60121)), and followup
enhancements: **Resources should only be responsible for read operations, such as an HTTP GET. Resources should NOT be used for MUTATIONS,
for example, HTTP methods like POST/PUT/DELETE.**

> "`httpResource` (and the more fundamental `resource`) both declare a dependency on data that should be fetched. It's not a suitable primitive for making imperative HTTP requests, such as requests to mutation APIs" - [Pawel Kozlowski, in the Resource API RFC](https://github.com/angular/angular/discussions/60121)

### What lead the ngrx-toolkit is following for Mutations

Libraries like Angular Query offer a [Mutation API](https://tanstack.com/query/latest/docs/framework/angular/guides/mutations) for such cases. Some time ago, Marko Stanimirović also [proposed a Mutation API for Angular](https://github.com/markostanimirovic/rx-resource-proto). This RFC is heavily inspired by Marko's work and adapts it as a custom feature for the NgRx Signal Store.

The goal is to provide a simple Mutation API that is available now for early adopters. Ideally, migration to future mutation APIs will be straightforward. Hence, we aim to align with current ideas for them (if any).

## Basic Usage - In Depth

The mutation functions can be used in a `withMutations()` feature, but can be used outside of one in something like a component or service as well.

Each mutation has the following:

- State signals: `value/status/error/isPending/status/hasValue`
- (optional) callbacks, `onSuccess` and `onError`
- Exposes a method of the same name as the mutation, which is a promise.

### Choosing between `rxMutation` and `httpMutation`

Though mutations and resources have different intents, the difference between `rxMutation` and `httpMutation` can be seen in a
similar way as `rxResource` and `httpResource`

For brevity, take `rx` as `rxMutation` and `http` for `httpMutation`

- `rx` to utilize RxJS streams, `http` to make an `HttpClient` request agnostic of RxJS (at the user's API surface)
- Primary property to pass parameters to:
  - `rx`'s `operation` is a function that defines the mutation logic. It returns an Observable,
  - `http` takes parts of `HttpClient`'s method signature, or a `request` object which accepts those parts
- Race condition handling
  - `rx` takes optional wrapper of an RxJS flattening operator.
    - By default `concat` (`concatMap`) sematics are used
    - Optionally can be passed a `switchOp (switchMap)`, `mergeOp (mergeMap)`, `concatOp (concatMap)`, and `exhauseOp (exhaustMap)`
  - `http` does not automatically prevent race conditions using a flattening operator. The caller is responsible for handling concurrency, e.g., by disabling buttons during processing

### Inside `withMutations()`

### Independent of a store
