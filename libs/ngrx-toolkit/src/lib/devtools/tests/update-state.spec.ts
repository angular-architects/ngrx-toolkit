import { signalStore, withMethods } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { setLoaded, withCallState } from '../../with-call-state';
import { updateState } from '../update-state';

describe('updateState', () => {
  it('should work with multiple updaters', () => {
    interface Item {
      id: string;
      name: string;
    }

    signalStore(
      withEntities<Item>(),
      withCallState({ collection: 'items' }),
      withMethods((store) => ({
        loadItems() {
          // This should not cause a type error
          updateState(
            store,
            'Items loaded successfully',
            setAllEntities([] as Item[]),
            setLoaded('items'),
          );
        },
      })),
    );
  });
});
