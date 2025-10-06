import { setResetState, withReset } from '@angular-architects/ngrx-toolkit';
import { inject } from '@angular/core';
import {
  getState,
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { addEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { AddTodo, Todo, TodoService } from '../shared/todo.service';

export const TodoStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({ _todoService: inject(TodoService) })),
  withReset(),
  withEntities<Todo>(),
  withState<{ selectedIds: number[] }>({
    selectedIds: [],
  }),
  withMethods((store) => {
    let currentId = 0;
    return {
      _add(todo: AddTodo) {
        patchState(store, addEntity({ ...todo, id: ++currentId }));
      },
      toggleFinished(id: number) {
        const todo = store.entityMap()[id];
        patchState(
          store,
          updateEntity({ id, changes: { finished: !todo.finished } }),
        );
      },
    };
  }),
  withHooks({
    onInit: (store) => {
      store._todoService.getData().forEach((todo) => {
        store._add(todo);
      });

      setResetState(store, getState(store));
    },
  }),
);
