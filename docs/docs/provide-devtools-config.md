---
title: provideDevtoolsConfig()
---

The `provideDevtoolsConfig` function allows you to configure the Redux DevTools integration for your NgRx SignalStore. This function is essential for setting up the DevTools with custom options. The function only needs to be called once in your appConfig or AppModule.

### Usage

To use `provideDevtoolsConfig`, you need to import it and call it in your providers array.

Here is an example of how to use it with Standalone components:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideDevtoolsConfig } from '@angular-architects/ngrx-toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDevtoolsConfig({
      name: 'MyApp',
      maxAge: 50,
      trace: true,
    }),
  ],
};
```

Here is an example of how to use it with traditional NgModules:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { provideDevtoolsConfig } from '@angular-architects/ngrx-toolkit';

@NgModule({
  providers: [
    provideDevtoolsConfig({
      name: 'MyApp',
      maxAge: 50,
      trace: true,
    }),
  ],
})
export class AppModule {}
```

### Options

The `provideDevtoolsConfig` function accepts an object with the following properties:

- `name` (string): Optional name for the DevTools instance. If no name is provided, "NgRx SignalStore" will be used.
- `instanceId` (string): An optional unique instance ID (useful when you have multiple stores).
- `trace` (boolean): Enables stack trace recording for dispatched actions.
- `traceLimit` (number): Limits the number of stack trace frames stored per action.
- `latency` (number): Specifies a delay (in milliseconds) between dispatching actions.
- `maxAge` (number): Maximum number of actions to keep in the history.
- `autoPause` (boolean): Automatically pause recording when the DevTools window is not open.
- `shouldHotReload` (boolean): Recompute state on hot reload.
- `shouldRecordChanges` (boolean): Record state changes; set to false to disable.

### Additional Information

For more details on the available options and their usage, refer to the [Redux DevTools Extension documentation](https://github.com/zalmoxisus/redux-devtools-extension).
