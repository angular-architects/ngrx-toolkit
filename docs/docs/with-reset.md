---
title: withReset()
---

`withReset()` adds a method the state of the Signal Store to its initial value. Nothing more to say about it 😅

Example:

```typescript
const Store = signalStore(
  withState({
    user: { id: 1, name: 'Konrad' },
    address: { city: 'Vienna', zip: '1010' },
  }),
  withReset(), // <-- the reset extension
  withMethods((store) => ({
    changeUser(id: number, name: string) {
      patchState(store, { user: { id, name } });
    },
    changeUserName(name: string) {
      patchState(store, (value) => ({ user: { ...value.user, name } }));
    },
  }))
);

const store = new Store();

store.changeUser(2, 'John');
console.log(store.user()); // { id: 2, name: 'John' }

store.resetState();
console.log(store.user()); // { id: 1, name: 'Konrad' }
```
