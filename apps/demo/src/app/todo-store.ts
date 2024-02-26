import { signalStore, withHooks, withMethods } from '@ngrx/signals';
import {
  removeEntity,
  setEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { patchState, withDevtools } from 'ngrx-toolkit';

export interface Todo {
  id: number;
  name: string;
  finished: boolean;
  description?: string;
  deadline?: Date;
}

export type AddTodo = Omit<Todo, 'id'>;

export const TodoStore = signalStore(
  { providedIn: 'root' },
  withDevtools('todo'),
  withEntities<Todo>(),
  withMethods((store) => {
    let currentId = 0;
    return {
      add(todo: AddTodo) {
        patchState(store, 'add todo', setEntity({ id: ++currentId, ...todo }));
      },

      remove(id: number) {
        patchState(store, 'remove todo', removeEntity(id));
      },

      toggleFinished(id: number): void {
        const todo = store.entityMap()[id];
        patchState(
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
