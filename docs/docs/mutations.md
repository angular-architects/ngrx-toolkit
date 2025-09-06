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

The mutations feature (`withMutations`) and methods (`httpMutation` and `rxMutation`) seek to offer an appropriate equivalent to signal resources for sending data back to the backend. The methods can be used in `withMutations()` or on their own.

In `withMutations()`

```ts
  // functions defined below
  withMutations((store) => ({
    increment: rxMutation({...}),
    saveToServer: httpMutation<void, CounterResponse>({...}),
  })),
```

Function examples, such as a component or service:

```ts
  // function calcSum(a: number, b: number): Observable<number> {...}

  private increment = rxMutation({
    operation: (params: Params) => {
      return calcSum(this.counterSignal(), params.value);
    },
    operator: concatOp,
    onSuccess: (result) => {
      this.counterSignal.set(result);
    },
    onError: (error) => {
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
    onSuccess: (response) => {
      console.log('Counter sent to server:', response);
    },
    onError: (error) => {
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

## TODO - actual API examples + definitons

1. Actual `httpMutation/rxMutation` standalones + feature
   - Bundled by rx and non-rx? Or functions then the feature?
   - Examples
