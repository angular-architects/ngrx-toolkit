---
title: Mutations
---

```typescript
import { httpMutation } from '@angular-architects/ngrx-toolkit';
```

```typescript
import { rxMutation } from '@angular-architects/ngrx-toolkit';

// Optional, `concatOp` is the default
import { concatOp, exhaustOp, mergeOp, switchOp } from '@angular-architects/ngrx-toolkit';
```

```typescript
import { withMutations } from '@angular-architects/ngrx-toolkit';
```

## Basic Usage - Summary

The mutations feature (`withMutations`) and methods (`httpMutation` and `rxMutation`) seek to offer an appropriate equivalent to signal resources for sending data back to the backend. The methods can be used in `withMutations()` or on their own.

This guide covers

- Why we do not use [`withResource`](./with-resource), and the direction on mutations from the community
- Key Features:
  - The params to pass (via RxJS or via `HttpClient` params without RxJS)
  - Callbacks available (`onSuccess` and `onError`)
  - Calling the mutations (optionally as promises)
  - State signals available (`value/status/error/isPending/hasValue`)
- `httpMutation` and `rxMutation` as standalone _functions_ that can be used outside of a store
- `withMutations` store _feature_, and the usage of `httpMutation` and `rxMutation` functions inside the feature

But before going into depth of the "How" and "When" to use mutations, it is important to give context about
the "Why" and "Who" of why mutations were built for the toolkit like this.

## Background

### Why not handle mutations using [`withResource`](./with-resource)?

The `resource` API and discussion about it naturally lead to talks about all async operations.
Notably, one position has been remained firm by the Angular team through resources' debut, RFCs (#1, [Architecture](https://github.com/angular/angular/discussions/60120)) and (#2, [APIs](https://github.com/angular/angular/discussions/60121)), and followup
enhancements: **Resources should only be responsible for read operations, such as an HTTP GET. Resources should NOT be used for MUTATIONS,
for example, HTTP methods like POST/PUT/DELETE.**

> "`httpResource` (and the more fundamental `resource`) both declare a dependency on data that should be fetched. It's not a suitable primitive for making imperative HTTP requests, such as requests to mutation APIs" - [Pawel Kozlowski, in the Resource API RFC](https://github.com/angular/angular/discussions/60121)

### Path the toolkit is following for Mutations

Libraries like Angular Query offer a [Mutation API](https://tanstack.com/query/latest/docs/framework/angular/guides/mutations) for such cases. Some time ago, Marko Stanimirović also [proposed a Mutation API for Angular](https://github.com/markostanimirovic/rx-resource-proto). These mutation functions and features are heavily inspired by Marko's work and adapts it as a custom feature/functions for the NgRx Signal Store.

The goal is to provide a simple Mutation API that is available now for early adopters. Ideally, migration to future mutation APIs will be straightforward. Hence, we aim to align with current ideas for them (if any).

## Key features

Each mutation has the following:

1. Parameters to pass to an RxJS stream (`rxMutation`) or RxJS agnostic `HttpClient` call (`httpMutation`)
1. (optional) callbacks: `onSuccess` and `onError`
1. Exposes a method of the same name as the mutation, returns a promise.
1. State signals: `value/status/error/isPending/hasValue`

### Params

```ts
// 1. Params + call

// RxJS stream
rxMutation({
  operation: (params: Params) => {
    // function calcSum(a: number, b: number): Observable<number>
    return calcSum(this.counterSignal(), params.value);
  },
})

// http call, as options
httpMutation<CreateUserRequest, User>((userData) => ({
  url: '/api/users',
  method: 'POST',
  body: userData,
})),
// OR
// http call, as function + options
httpMutation<Params, CounterResponse>({
  request: (p) => ({
    url: `https://httpbin.org/post`,
    method: 'POST',
    body: { counter: p.value },
    headers: { 'Content-Type': 'application/json' },
  })
);
```

### Callbacks

```ts
// 2. In the mutation: *optional* `onSuccess` and `onError` callbacks
({
  onSuccess: (result) => {
    // optional
    // method:
    //     this.counterSignal.set(result);
    // store:
    //     patchState(store, {counter: result});
  },
  onError: (error) => {
    // optional
    console.error('Error occurred:', error);
  },
});
```

### Methods

```ts
// 3. Enables the method (returns a promise)

// Call directly
store.increment({...});
mutationName.saveToServer({...});

// or await promises
const inc = await store.increment({...}); if (inc.status === 'success')
const save = await store.save({...}); if (inc.status === 'error')
```

### Signal values

```ts
// 4. Enables the following signal states

// via store
store.increment.value; // also status/error/isPending/status/hasValue;

// via member variable
mutationName.value; // ^^^
```

### Usage: `withMutations()` or solo functions

Both of the mutation functions can be used either

- In a signal store, inside of `withMutations()`
- On its own, for example, like a class member of a component or service

#### Independent of a store

```ts
@Component({...})
class CounterMutation {
  private increment = rxMutation({...});
  private saveToServer = httpMutation<Params, CounterResponse>({...});
}
```

#### Inside `withMutations()`

```ts
export const CounterStore = signalStore(
  // ...
  withMutations((store) => ({
    // the same functions
    increment: rxMutation({...}),
    saveToServer: httpMutation<void, CounterResponse>({...}),
  })),
);
```

## Usage - In Depth

The mutation functions can be used in a `withMutations()` feature, but can be used outside of one in something like a component or service as well.

### Key features

Each mutation has the following:

<!-- TODO - params - roll into the `rx` vs `http`? -->

- Passing params via RxJS or RxJS-less `HttpClient` signature - see last section on difference
- State signals: `value/status/error/isPending/status/hasValue`
- (optional) callbacks: `onSuccess` and `onError`
- Exposes a method of the same name as the mutation, which is a promise.

#### State Signals

```ts
// Fields + types types:
export type MutationStatus = 'idle' | 'pending' | 'error' | 'success';

export type Mutation<Parameter, Result> = {
  status: Signal<'idle' | 'pending' | 'error' | 'success'>;
  value: Signal<Result | undefined>;
  isPending: Signal<boolean>;
  isSuccess: Signal<boolean>;
  error: Signal<unknown>;
  hasValue(): this is Mutation<Exclude<Parameter, undefined>, Result>; // type narrows `.value()`
};

// Accessed from store or variable
storeName.mutationName.value; // or other signals
mutationName.value; // ^^^
```

#### (optional) Callbacks: `onSuccess` and `onError`

Callbacks can be used on success or error of the mutation. This allows for side effects, such as patching/setting
state like a service's signal or a store's property.

To shake up the examples, lets define an `onSuccess` in a `withMutations()` using store and an `onError` in a mutation which is a member of a component.

```ts
export const CounterStore = signalStore(
  // ...
  withMutations((store) => ({
    increment: rxMutation({
      // ...
      onSuccess: (result) => {
        console.log('result', result);
        patchState(store, { counter: result });
      },
    }),
  })),
);

@Component({...})
class CounterMutation {
  // ...
  private saveToServer = httpMutation<Params, CounterResponse>({
    // ...
    onError: (error) => {
      console.error('Failed to send counter:', error);
    },
  });
}
```

#### Methods

A mutation is its own function to be invoked, returning a promise should you want to await one.

```ts
@Component({...})
class CounterRxMutation {
  private increment = rxMutation({...});
  private store = inject(CounterStore);

  // await or not
  async incrementBy13() {
    const resultA = await this.increment({ value: 13 });
    if (resultA.status === 'success') { ... }

    const resultB = await this.store.increment({ value: 13 });
    if (resultB.status === 'success') { ... }
  }

  incrementBy12() {
    this.increment({ value: 12 });

    this.store.increment({ value: 12 });
  }
}
```

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
