---
title: withImmutableState()
---

`withImmutableState` acts like `withState` but protects
the state against unintended mutable changes, by throwing
a runtime error.

The protection is not limited to changes within the
SignalStore but also outside of it.

```ts
const initialState = { user: { id: 1, name: 'Konrad' } };

const UserStore = signalStore(
  { providedIn: 'root' },
  withImmutableState(initialState),
  withMethods((store) => ({
    mutateState() {
      patchState(store, (state) => {
        state.user.id = 2;
        return state;
      });
    },
  }))
);
```

If `mutateState` is called, a runtime error will be thrown.

```ts
class SomeComponent {
  userStore = inject(UserStore);

  mutateChange() {
    this.userStore.mutateState(); // 🔥 throws an error
  }
}
```

The same is also true, when `initialState` is changed:

```ts
initialState.user.id = 2; // 🔥 throws an error
```

Finally, it could also happen, if third-party libraries or the Angular API does mutations to the state.

A common example is the usage in template-driven forms:

```ts
@Component({
  template: ` <input [(ngModel)]="userStore.user().id" /> `,
})
class SomeComponent {}
```

## Protection in production mode

By default, `withImmutableState` is only active in development mode.

There is a way to enable it in production mode as well:

```ts
const UserStore = signalStore({ providedIn: 'root' }, withImmutableState(initialState, { enableInProduction: true }));
```
