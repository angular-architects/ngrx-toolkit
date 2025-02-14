import { patchState, signalStore, withHooks, withMethods } from '@ngrx/signals';
import {
  removeEntity,
  setEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { withStorageSync } from '@angular-architects/ngrx-toolkit';
import { AddTodo, Todo, TodoService } from '../shared/todo.service';
import { inject } from '@angular/core';

export const SyncedTodoStore = signalStore(
  { providedIn: 'root' },
  withEntities<Todo>(),
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
    onInit(store, todoService = inject(TodoService)) {
      const todos = todoService.getData();
      todos.forEach((todo) => store.add(todo));
    },
  }),
  withStorageSync({
    key: 'todos',
  })
);
