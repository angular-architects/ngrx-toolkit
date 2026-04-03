import { signalStore, withMethods } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { event } from '@ngrx/signals/events';
import { setLoaded, withCallState } from '../../with-call-state';
import { updateState } from '../update-state';

describe('updateState', () => {
  it('should work with multiple updaters via string action', () => {
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

  it('should work with multiple updaters via EventInstance action', () => {
    interface Item {
      id: string;
      name: string;
    }

    const itemsLoaded = event('Items loaded successfully');

    signalStore(
      withEntities<Item>(),
      withCallState({ collection: 'items' }),
      withMethods((store) => ({
        loadItems() {
          // This should not cause a type error
          updateState(
            store,
            itemsLoaded(),
            setAllEntities([] as Item[]),
            setLoaded('items'),
          );
        },
      })),
    );
  });
});
