import { Component, effect, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SyncedTodoStore } from './synced-todo-store';
import { SelectionModel } from '@angular/cdk/collections';
import { CategoryStore } from '../category.store';
import { Todo } from '../todo-store';

@Component({
  selector: 'demo-todo-storage-sync',
  standalone: true,
  imports: [MatCheckboxModule, MatIconModule, MatTableModule],
  templateUrl: './todo-storage-sync.component.html',
  styleUrl: './todo-storage-sync.component.scss',
})
export class TodoStorageSyncComponent {
  todoStore = inject(SyncedTodoStore);
  categoryStore = inject(CategoryStore);

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
}
