---
title: withFeatureFactory()
---

The `withFeatureFactory()` function allows passing properties, methods, or signals from a SignalStore to a feature. It is an advanced feature, primarily targeted for library authors for SignalStore features.

Its usage is very simple. It is a function which gets the current store:

```typescript
function withSum(a: Signal<number>, b: Signal<number>) {
  return signalStoreFeature(
    withComputed(() => ({
      sum: computed(() => a() + b()),
    }))
  );
}

signalStore(
  withState({ a: 1, b: 2 }),
  withFeatureFactory((store) => withSum(store.a, store.b))
);
```

## Use Case 1: Mismatching Input Constraints

`signalStoreFeature` can define input constraints that must be fulfilled by the SignalStore calling the feature. For example, a method `load` needs to be present to fetch data. The default implementation would be:

```typescript
type Entity = {
  id: number;
  name: string;
};

function withEntityLoader() {
  return signalStoreFeature(
    type<{
      methods: {
        load: (id: number) => Promise<Entity>;
      };
    }>(),
    withState({
      entity: undefined as Entity | undefined,
    }),
    withMethods((store) => ({
      async setEntityId(id: number) {
        const entity = await store.load(id);
        patchState(store, { entity });
      },
    }))
  );
}
```

The usage of `withEntityLoader` would be:

```typescript
signalStore(
  withMethods((store) => ({
    load(id: number): Promise<Entity> {
      // some dummy implementation
      return Promise.resolve({ id, name: 'John' });
    },
  })),
  withEntityLoader()
);
```

A common issue with generic features is that the input constraints are not fulfilled exactly. If the existing `load` method would return an `Observable<Entity>`, we would have to rename that one and come up with a `load` returning `Promise<Entitiy>`. Renaming an existing method might not always be an option. Beyond that, what if two different features require a `load` method with different return types?

Another aspect is that we probably want to encapsulate the load method since it is an internal one. The current options don't allow that, unless the `withEntityLoader` explicitly defines a `_load` method.

For example:

```typescript
signalStore(
  withMethods((store) => ({
    load(id: number): Observable<Entity> {
      return of({ id, name: 'John' });
    },
  })),
  withEntityLoader()
);
```

`withFeatureFactory` solves those issues by mapping the existing method to whatever `withEntityLoader` requires. `withEntityLoader` needs to move the `load` method dependency to an argument of the function:

```typescript
function withEntityLoader(load: (id: number) => Promise<Entity>) {
  return signalStoreFeature(
    withState({
      entity: undefined as Entity | undefined,
    }),
    withMethods((store) => ({
      async setEntityId(id: number) {
        const entity = await load(id);
        patchState(store, { entity });
      },
    }))
  );
}
```

`withFeatureFactory` can now map the existing `load` method to the required one.

```typescript
const store = signalStore(
  withMethods((store) => ({
    load(id: number): Observable<Entity> {
      // some dummy implementation
      return of({ id, name: 'John' });
    },
  })),
  withFeatureFactory((store) => withEntityLoader((id) => firstValueFrom(store.load(id))))
);
```

## Use Case 2: Generic features with Input Constraints

Another potential issue with advanced features in a SignalStore is that multiple  
features with input constraints cannot use generic types.

For example, `withEntityLoader` is a generic feature that allows the caller to  
define the entity type. Alongside `withEntityLoader`, there's another feature,  
`withOptionalState`, which has input constraints as well.

Due to [certain TypeScript limitations](https://ngrx.io/guide/signals/signal-store/custom-store-features#known-typescript-issues),  
the following code will not compile:

```typescript
function withEntityLoader<T>() {
  return signalStoreFeature(
    type<{
      methods: {
        load: (id: number) => Promise<T>;
      };
    }>(),
    withState({
      entity: undefined as T | undefined,
    }),
    withMethods((store) => ({
      async setEntityId(id: number) {
        const entity = await store.load(id);
        patchState(store, { entity });
      },
    }))
  );
}

function withOptionalState<T>() {
  return signalStoreFeature(
    type<{ methods: { foo: () => string } }>(),
    withState({
      state: undefined as T | undefined,
    })
  );
}

signalStore(
  withMethods((store) => ({
    foo: () => 'bar',
    load(id: number): Promise<Entity> {
      // some dummy implementation
      return Promise.resolve({ id, name: 'John' });
    },
  })),
  withOptionalState<Entity>(),
  withEntityLoader<Entity>()
);
```

Again, `withFeatureFactory` can solve this issue by replacing the input constraint with a function parameter:

```typescript
function withEntityLoader<T>(loader: (id: number) => Promise<T>) {
  return signalStoreFeature(
    withState({
      entity: undefined as T | undefined,
    }),
    withMethods((store) => ({
      async setEntityId(id: number) {
        const entity = await loader(id);
        patchState(store, { entity });
      },
    }))
  );
}

function withOptionalState<T>(foo: () => string) {
  return signalStoreFeature(
    withState({
      state: undefined as T | undefined,
    })
  );
}

signalStore(
  withMethods((store) => ({
    foo: () => 'bar',
    load(id: number): Promise<Entity> {
      // some dummy implementation
      return Promise.resolve({ id, name: 'John' });
    },
  })),
  withFeatureFactory((store) => withOptionalState<Entity>(store.foo.bind(store))),
  withFeatureFactory((store) => withEntityLoader<Entity>(store.load.bind(store)))
);
```
