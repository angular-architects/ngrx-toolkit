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

```typescript
// Optional, `concatOp` is the default.
import { concatOp, exhaustOp, mergeOp, switchOp } from '@angular-architects/ngrx-toolkit';
```

## Basic Usage

The mutations feature (`withMutations`) and methods (`httpMutation` and `rxMutation`) seek to offer an appropriate equivalent to signal resources for sending data back to the backend. The methods can be used in `withMutations()` or on their own.

This guide covers

- Why we do not use [`withResource`](./with-resource), and the direction on mutations from the community
- Key Features ([summary](#key-features-summary) and [in depth](#key-features-in-depth)):
  <!-- TODO (discuss): I think it is important to know it is `HttpClient` under the hood for stuff like interceptors and global stuff -->
  - The params to pass (via RxJS or via `HttpClient` params without RxJS)
  - Callbacks available (`onSuccess` and `onError`)
  - Flattening operators (`concatOp, exhaustOp, mergeOp, switchOp`)
  - Calling the mutations (optionally as promises)
  <!-- TODO - narrowing not working like intended? -->
  - State signals available (`value/status/error/isPending`) + `hasValue` signal to narrow type- `httpMutation` and `rxMutation`
  - [How to use](#usage-withmutations-or-solo-functions), as:
    - _standalone functions_
    - In `withMutations` store _feature_
- [Differences](#choosing-between-rxmutation-and-httpmutation) between `httpMutation` and `rxMutation`
- [Full examples](#full-example) of
  - Both mutations in a `withMutations()`
  - Standalone functions in a component

But before going into depth of the "How" and "When" to use mutations, it is important to give context about
the "Why" and "Who" of why mutations were built for the toolkit like this.

## Background

<!-- TODO - Johanderson's point on legacy need for occasional non-GET in resources -->

### Why not handle mutations using [`withResource`](./with-resource)?

The `resource` API and discussion about it naturally lead to talks about all async operations.
Notably, one position has been remained firm by the Angular team through resources' debut, RFCs (#1, [Architecture](https://github.com/angular/angular/discussions/60120)) and (#2, [APIs](https://github.com/angular/angular/discussions/60121)), and followup
enhancements: **Resources should only be responsible for read operations, such as an HTTP GET. Resources should NOT be used for MUTATIONS,
for example, HTTP methods like POST/PUT/DELETE.**

> "`httpResource` (and the more fundamental `resource`) both declare a dependency on data that should be fetched. It's not a suitable primitive for making imperative HTTP requests, such as requests to mutation APIs" - [Pawel Kozlowski, in the Resource API RFC](https://github.com/angular/angular/discussions/60121)

### Path the toolkit is following for Mutations

Libraries like Angular Query offer a [Mutation API](https://tanstack.com/query/latest/docs/framework/angular/guides/mutations) for such cases. Some time ago, Marko Stanimirović also [proposed a Mutation API for Angular](https://github.com/markostanimirovic/rx-resource-proto). These mutation functions and features are heavily inspired by Marko's work and adapts it as a custom feature/functions for the NgRx Signal Store.

The goal is to provide a simple Mutation API that is available now for early adopters. Ideally, migration to future mutation APIs will be straightforward. Hence, we aim to align with current ideas for them (if any).

## Key features (summary)

Each mutation has the following:

1. Parameters to pass to an RxJS stream (`rxMutation`) or RxJS agnostic `HttpClient` call (`httpMutation`)
1. Callbacks: `onSuccess` and `onError` (optional)
1. Flattening operators (optional, defaults to `concatOp`)
1. Exposes a method of the same name as the mutation, returns a promise.
1. State signals: `value/status/error/isPending/hasValue`

### Params

See dedicated section on [choosing between `rxMutation` and `httpMutation`](#choosing-between-rxmutation-and-httpmutation)

```ts
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

In the mutation: _optional_ `onSuccess` and `onError` callbacks

```ts
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

### Flattening operators

Enables handling race conditions

```ts
// Default: concatOp
// All options: concatOp, exhaustOp, mergeOp, switchOp

increment: rxMutation({
  // ...
  operator: concatOp, // default if `operator` omitted
}),

saveToServer: httpMutation<void, CounterResponse>({
  // ...
  // Passing in a custom option. Need to import like:
  // `import { switchOp } from '@angular-architects/ngrx-toolkit'`
  operator: switchOp,
}),
```

### Methods

Enables the method (returns a promise)

```ts
// Call directly
store.increment({...});
mutationName.saveToServer({...});

// or await promises
const inc = await store.increment({...}); if (inc.status === 'success')
const save = await store.save({...}); if (inc.status === 'error')
```

### Signal values

```ts
// 5. Enables the following signal states

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

### Key features (in depth)

Each mutation has the following:

<!-- TODO - params - roll into the `rx` vs `http`? -->

- Passing params via RxJS or RxJS-less `HttpClient` signature
  - See ["Choosing between `rxMutation` and `httpMutation`"](#choosing-between-rxmutation-and-httpmutation)
- State signals: `value/status/error/isPending/status/hasValue`
- (optional, but has default) Flattening operators
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

#### Callbacks: `onSuccess` and `onError` (optional)

Callbacks can be used on success or error of the mutation. This allows for side effects, such as patching/setting
state like a service's signal or a store's property.

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

#### Flattening operators (optional to specify, has default)

```ts
// Default: concatOp
// All options: concatOp, exhaustOp, mergeOp, switchOp

(withMutations((store) => ({
  increment: rxMutation({
    // ...
    operator: concatOp, // default if `operator` omitted
  }),
})),
  class SomeComponent {
    private saveToServer = httpMutation<Params, CounterResponse>({
      // ...
      // Passing in a custom option. Need to import like:
      // `import { switchOp } from '@angular-architects/ngrx-toolkit'`
      operator: switchOp,
    });
  });
```

#### Methods

A mutation is its own function to be invoked, returning a promise should you want to await one.

```ts
@Component({...})
class CounterRxMutation {
  private increment = rxMutation({...});
  private store = inject(CounterStore);

  // To await
  async incrementBy13() {
    const resultA = await this.increment({ value: 13 });
    if (resultA.status === 'success') { ... }

    const resultB = await this.store.increment({ value: 13 });
    if (resultB.status === 'success') { ... }
  }

  // or not to await, that is the question
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

- `rx` to utilize RxJS streams, `http` to make an `HttpClient` request
  - `rx` could be any valid observable, even if it is not HTTP related.
  - `http` has to be an HTTP request. The user's API is agnostic of RxJS. _Technically, HttpClient with observables is used under the hood_.
- Primary property to pass parameters to:
  - `rx`'s `operation` is a function that defines the mutation logic. It returns an Observable,
  - `http` takes parts of `HttpClient`'s method signature, or a `request` object which accepts those parts

<!-- TODO - I was wrong on flattening part, re-write -->

## Full example

Our example application in the repository has more details and implementations, but here is a full example in a store using `withMutations`.

This example is a dedicated store with `withMutations` and used in a component, but could be just the mutation functions as class members of a service/component or `const`s, for example.

### Declare

```ts
import { concatOp, httpMutation, rxMutation, withMutations } from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withState } from '@ngrx/signals';
import { delay, Observable } from 'rxjs';

export type Params = {
  value: number;
};

// httpbin.org echos the request in the json property
export type CounterResponse = {
  json: { counter: number };
};

export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({
    counter: 0,
    lastResponse: undefined as unknown | undefined,
  }),
  withMutations((store) => ({
    increment: rxMutation({
      operation: (params: Params) => {
        return calcSum(store.counter(), params.value);
      },
      operator: concatOp,
      onSuccess: (result) => {
        console.log('result', result);
        patchState(store, { counter: result });
      },
      onError: (error) => {
        console.error('Error occurred:', error);
      },
    }),
    saveToServer: httpMutation<void, CounterResponse>({
      request: () => ({
        url: `https://httpbin.org/post`,
        method: 'POST',
        body: { counter: store.counter() },
        headers: { 'Content-Type': 'application/json' },
      }),
      onSuccess: (response) => {
        console.log('Counter sent to server:', response);
        patchState(store, { lastResponse: response.json });
      },
      onError: (error) => {
        console.error('Failed to send counter:', error);
      },
    }),
  })),
);

// return of(a + b);
function calcSum(a: number, b: number): Observable<number> {
  function createSumObservable(a: number, b: number): Observable<number> {...}
  return createSumObservable(a, b).pipe(delay(500));
}
```

### Use

```ts
@Component({...})
export class CounterMutation {
  private store = inject(CounterStore);

  // signals
  protected counter = this.store.counter;
  protected error = this.store.incrementError;
  protected isPending = this.store.incrementIsPending;
  protected status = this.store.incrementStatus;
  // signals
  protected saveError = this.store.saveToServerError;
  protected saveIsPending = this.store.saveToServerIsPending;
  protected saveStatus = this.store.saveToServerStatus;
  protected lastResponse = this.store.lastResponse;

  increment() {
    this.store.increment({ value: 1 });
  }

  // promise version nice if you want to the result's `status`
  async saveToServer() {
    await this.store.saveToServer();
  }
}
```
