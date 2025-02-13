import { patchState, signalStore, withHooks, withMethods } from '@ngrx/signals';
import {
  withEntities,
  setEntity,
  removeEntity,
  updateEntity,
} from '@ngrx/signals/entities';
import { withStorageSync } from '@angular-architects/ngrx-toolkit';
import { Todo, AddTodo } from '../shared/todo.service';

export const SyncedTodoStore = signalStore(
  { providedIn: 'root' },
  withEntities<Todo>(),
  withStorageSync({
    key: 'todos',
  }),
  withMethods((store) => {
    let currentId = 0;
    return {
      add(todo: AddTodo) {
        patchState(store, setEntity({ id: ++currentId, ...todo }));
      },

      remove(id: number) {
        patchState(store, removeEntity(id));
      },

      toggleFinished(id: number): void {
        const todo = store.entityMap()[id];
        patchState(
          store,
          updateEntity({ id, changes: { finished: !todo.finished } })
        );
      },
    };
  }),
  withHooks({
    // onInit(store, todoService = inject(TodoService)) {
    //   const todos = todoService.getData();
    //   todos.forEach((todo) => store.add(todo));
    // },
  })
);
