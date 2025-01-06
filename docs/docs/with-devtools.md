Redux Devtools is a powerful browser extension tool, that allows you to inspect every change in your stores. Originally, it was designed for Redux, but it can also be used with the SignalStore. You can download it for Chrome [here](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd).

To use the Devtools, you need to add the `withDevtools()` extension to your SignalStore:

```typescript
export const FlightStore = signalStore(
  { providedIn: 'root' },
  withDevtools('flights'), // <-- add this
  withState({ flights: [] as Flight[] })
  // ...
);
```

After that, open your app and navigate to the component that uses the store. Open the Devtools and you will see the `flights` store in the Devtools under the name "NgRx Signal Store"

You can find a working example in the [demo app](https://github.com/angular-architects/ngrx-toolkit/blob/main/apps/demo/src/app/devtools/todo-store.ts).

:::info
The extensions don't activate during app initialization (as it is with `@ngrx/store`). You need to open the Devtools and select the "NgRx Signal Store" tab to activate them.
:::

<img src="../img/devtools.png" width="1000" />

## `updateState` vs `patchState`

The Signal Store does not use the Redux pattern, so there are no action names involved by default. Instead, every action is referred to as a "Store Update". If you want to customize the action name for better clarity, you can use the `updateState` function instead of `patchState`:

```typescript
patchState(this.store, { loading: false });

// updateState is a wrapper around patchState and has an action name as second parameter
updateState(this.store, 'update loading', { loading: false });
```

## `renameDevtoolsName`

If multiple instances of a given SignalStore exist, the Devtools will index the names. For example, if you have two `TodoDetail` instances with the name `todo-detail`, the first one will be named `todo-detail` and the second one `todo-detail-1`.

At any time, you can use `renameDevtoolsName` to change the name of the store in the Devtools.

The following example shows a component, which has a locally provided store and renames it according to the `id` of the `todo` Signal.

```typescript
const TodoDetailStore = signalStore(
  withDevtools('todo-detail'),
  withState({ id: 1 })
);

@Component({
  // ...
  providers: [TodoDetailStore]
})
export class TodoDetailComponent {
  readonly #todoDetailStore = inject(TodoDetailStore);
  todo = input.required<Todo>();

  constructor() {
    effect(() => {
      renameDevtoolsName(this.#todoDetailStore, `todo-${this.todo().id}`);
    });
  }
}
```

## `withDisabledNameIndices()`

`withDevtools` foresees the possibility to add features which extend or modify it. At the moment, `withDisabledNameIndices` is the only feature available. It disables the automatic indexing of the store names in the Devtools.

If multiple instances exist at the same time, `withDisabledNameIndices` will throw an error. This is useful if you want to ensure that only one instance of a store is active at a time or that the store name is unique.

You activate per store:

```typescript
    const Store = signalStore(
  { providedIn: 'root' },
  withDevtools('flights', withDisabledNameIndices()),
  withState({ airline: 'Lufthansa' })
);
```

## Disabling Devtools in production

`withDevtools()` is by default enabled in production mode, if you want to tree-shake it from the application bundle you need to abstract it in your environment file.

It is required to add the `withDevtools` function to the environment files.

environments/environment.ts:

```typescript
import { withDevtools } from '@angular-architects/ngrx-toolkit';

export const environment = {
  storeWithDevTools: withDevtools
}
```

environments/environment.prod.ts

```typescript
import { withDevtoolsStub } from '@angular-architects/ngrx-toolkit';

export const environment = {
  storeWithDevTools: withDevToolsStub
}
```

Then you can create utility function which can be used across the application
e.g.:

shared/store.features.ts (or any other file)

```typescript
import { environment } from 'src/environments/environment';

export const withTreeShakableDevTools = environment.storeWithDevTools;
```

And use it in your store definitions:

```typescript
export const SomeStore = signalStore(
  withState({ strings: [] as string[] }),
  withTreeShakableDevTools('featureName')
);
```

Also make sure you have defined file replacements in angular.json prod configuration:

```json
"fileReplacements": [
{
"replace": "src/environments/environment.ts",
"with": "src/environments/environment.prod.ts"
}
]
```
