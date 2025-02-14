import { patchState, signalStore, withMethods } from '@ngrx/signals';
import {
  removeEntity,
  setEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { AddTodo, Todo } from '../shared/todo.service';
import {
  withIndexeddb,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';

export const SyncedTodoStore = signalStore(
  { providedIn: 'root' },
  withEntities<Todo>(),
  withStorageSync(
    {
      key: 'todos-indexeddb',
    },
    withIndexeddb()
  ),
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
  })
  //withHooks({
  //  onInit(store, todoService = inject(TodoService)) {
  //    const todos = todoService.getData();
  //    todos.forEach((todo) => store.add(todo));
  //  },
  //})
);
