---
title: withConnect()
---

```typescript
import { withConnect } from '@angular-architects/ngrx-toolkit';
```

`withConnect()` adds a method to connect Signals back to your store. Everytime these Signals change, the store will be updated accordingly.

Example:

```ts
const Store = signalStore(
  { protectedState: false },
  withState({
    maxWarpFactor: 8,
    shipName: 'USS Enterprise',
    registration: 'NCC-1701',
    poeple: 430,
  }),
  withConnect()
);
```

```ts
@Component({ ... })
export class MyComponent {
  private store = inject(OfferListStore);

  readonly maxWarpFactor = signal(8);
  readonly registration = signal('NCC-1701');
  readonly people = signal(430);

  constructor() {
    //
    // Every change in the local Signals is
    // refected in the store
    //
    this.store.connect(() => ({
        //
        // Subset of state in the store
        //
        maxWarpFactor: this.maxWarpFactor(),
        registration: this.registration(),
        poeple: this.poeple(),
    }));
  }

  ...
}
```
