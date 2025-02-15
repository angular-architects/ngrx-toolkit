import { Component, effect, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SyncedTodoStore } from './synced-todo-store';
import { SelectionModel } from '@angular/cdk/collections';
import { Todo } from '../shared/todo.service';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'demo-todo-indexeddb-sync',
  imports: [MatCheckboxModule, MatIconModule, MatTableModule, MatButton],
  templateUrl: './todo-indexeddb-sync.component.html',
  styleUrl: './todo-indexeddb-sync.component.scss',
  standalone: true,
})
export class TodoIndexeddbSyncComponent {
  todoStore = inject(SyncedTodoStore);

  displayedColumns: string[] = ['finished', 'name', 'description', 'deadline'];
  dataSource = new MatTableDataSource<Todo>([]);
  selection = new SelectionModel<Todo>(true, []);

  constructor() {
    effect(() => {
      this.dataSource.data = this.todoStore.entities();
    });
  }

  checkboxLabel(todo: Todo) {
    this.todoStore.toggleFinished(todo.id);
  }

  removeTodo(todo: Todo) {
    this.todoStore.remove(todo.id);
  }

  onClickReset() {
    this.todoStore.reset();
  }
}
