import { Component, effect, inject, input } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { Todo } from './todo-store';
import { signalStore, withState } from '@ngrx/signals';
import {
  renameDevtoolsName,
  withDevtools,
} from '@angular-architects/ngrx-toolkit';

/**
 * This Store can be instantiated multiple times, if the user
 * selects different todos.
 *
 * The devtools extension will start to index the store names.
 *
 * Since we want to apply our own store name, (depending on the id), we
 * run renameDevtoolsStore() in the effect.
 */
const TodoDetailStore = signalStore(
  withDevtools('todo-detail'),
  withState({ id: 1 })
);

@Component({
  selector: 'demo-todo-detail',
  template: ` <mat-card>
    <mat-card-title>{{ todo().name }}</mat-card-title>
    <mat-card-content>
      <textarea>{{ todo().description }}</textarea>
    </mat-card-content>
  </mat-card>`,
  standalone: true,
  imports: [MatCardModule],
  providers: [TodoDetailStore],
  styles: `
    mat-card {
      margin: 10px;
    }
  `,
})
export class TodoDetailComponent {
  readonly #todoDetailStore = inject(TodoDetailStore);
  todo = input.required<Todo>();

  constructor() {
    effect(
      () => {
        renameDevtoolsName(this.#todoDetailStore, `todo-${this.todo().id}`);
      },
      { allowSignalWrites: true }
    );
  }
}
