import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withHooks } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';

export interface Category {
  id: number;
  name: string;
}

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withDevtools('category'),
  withEntities<Category>(),
  withHooks({
    onInit: (store) => {
      patchState(
        store,
        setAllEntities([
          { id: 1, name: 'Important' },
          { id: 2, name: 'Nice to Have' },
        ])
      );
    },
  })
);
