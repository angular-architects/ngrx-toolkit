import { computed } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals';
import {
  EntityMap,
  removeEntity,
  setEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { getSignalValues, updateState, withDevtools } from 'ngrx-toolkit';

export interface Todo {
  id: number;
  name: string;
  finished: boolean;
  description?: string;
  deadline?: Date;
}

export type AddTodo = Omit<Todo, 'id'>;

export const TodoWithComputedStore = signalStore(
  { providedIn: 'root' },
  withDevtools('todo'),
  withEntities<Todo>(),
  withComputed(store => ({
    openItems: computed(() => openItems(getSignalValues(store)))
  })),
  withMethods((store) => {
    let currentId = 0;
    return {
      add(todo: AddTodo) {
        updateState(store, 'add todo', setEntity({ id: ++currentId, ...todo }));
      },

      remove(id: number) {
        updateState(store, 'remove todo', removeEntity(id));
      },

      toggleFinished(id: number): void {
        const todo = store.entityMap()[id];
        updateState(
          store,
          'toggle todo',
          updateEntity({ id, changes: { finished: !todo.finished } })
        );
      },
    };
  }),
  withHooks({
    onInit: (store) => {
      store.add({ name: 'Go for a Walk', finished: false });
      store.add({ name: 'Sleep 8 hours once', finished: false });
      store.add({ name: 'Clean the room', finished: true });
    },
  })
);


function openItems(state: {entities: Todo[], entityMap: EntityMap<Todo>} ): string {
  const openIds = state.entities.filter(todo => !todo.finished).map(todo => todo.id);
  const strings = openIds.map(id => state.entityMap[id].name);
  return strings.join(', ');
}