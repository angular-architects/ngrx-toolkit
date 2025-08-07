import { computed } from '@angular/core';
import { patchState, signalStore, withState } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';

it('should compile when signalStore is extended from', () => {
  class CounterStore extends signalStore(
    { protectedState: false },
    withState({ count: 0 }),
    withDevtools('counter-store'),
  ) {
    readonly myReadonlyProp = 42;

    readonly doubleCount = computed(() => this.count() * 2);

    increment(): void {
      patchState(this, { count: this.count() + 1 });
    }
  }
});
