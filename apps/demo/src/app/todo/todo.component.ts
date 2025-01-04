import { Component, effect, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Todo, TodoStore } from '../todo-store';
import { CategoryStore } from '../category.store';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'demo-todo',
  templateUrl: 'todo.component.html',
  styleUrl: 'todo.component.scss',
  imports: [MatCheckboxModule, MatIconModule, MatTableModule],
})
export class TodoComponent {
  todoStore = inject(TodoStore);
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
