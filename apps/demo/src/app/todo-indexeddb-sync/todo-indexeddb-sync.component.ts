import { Component, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withIndexeddbSync } from '@angular-architects/ngrx-toolkit';
import { MatButton } from '@angular/material/button';

type TodoModel = {
  user: {
    name: string;
  };
  todos: {
    title: string;
    detail: string;
    done: boolean;
  }[];
};

const TodoIndexedDBSync = signalStore(
  withState<TodoModel>({
    user: {
      name: 'mzkmnk',
    },
    todos: [
      {
        title: 'todo1',
        detail: 'detail1',
        done: false,
      },
      {
        title: 'todo2',
        detail: 'detail2',
        done: true,
      },
    ],
  }),
  withIndexeddbSync(),
  withMethods((store) => ({
    changeUserName(): void {
      patchState(store, {
        user: {
          name: 'mzkmnk2',
        },
      });
    },
  }))
);

@Component({
  selector: 'demo-app-todo-indexeddb-sync',
  template: `
    <div>
      <h2>Todo IndexedDB Sync</h2>
      <h3>username</h3>
      <p>{{ username() }}</p>
      <button mat-flat-button (click)="changeUsername()">
        change user name
      </button>
    </div>
  `,
  providers: [TodoIndexedDBSync],
  imports: [MatButton],
})
export class TodoIndexeddbSyncComponent {
  private readonly todoIndexedDBSync = inject(TodoIndexedDBSync);

  username = this.todoIndexedDBSync.user.name;

  changeUsername(): void {
    this.todoIndexedDBSync.changeUserName();
  }
}
