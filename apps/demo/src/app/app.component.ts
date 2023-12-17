import { SelectionModel } from '@angular/cdk/collections';
import { Component, effect, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Todo, TodoStore } from './todo-store';
import { JsonPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CategoryStore } from './category.store';

@Component({
  selector: 'demo-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [MatTableModule, MatCheckboxModule, MatIconModule],
  styleUrl: './app.component.css',
})
export class AppComponent {
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
