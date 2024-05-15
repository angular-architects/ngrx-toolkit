import { Component, computed, effect, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Todo } from '../todo-store';
import { CategoryStore } from '../category.store';
import { SelectionModel } from '@angular/cdk/collections';
import { TodoWithComputedStore } from './todo-with-computed-store';
import { getSignalValues } from 'ngrx-toolkit';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'demo-todo-with-computed',
  templateUrl: 'todo-with-computed.component.html',
  styleUrl: 'todo-with-computed.component.scss',
  standalone: true,
  imports: [MatCheckboxModule, MatIconModule, MatTableModule, CommonModule],
})
export class TodoWithComputedComponent {
  todoStore = inject(TodoWithComputedStore);
  categoryStore = inject(CategoryStore);

  displayedColumns: string[] = ['finished', 'name', 'description', 'deadline'];
  dataSource = new MatTableDataSource<Todo>([]);
  selection = new SelectionModel<Todo>(true, []);

  entireState = computed(() =>  getSignalValues(this.todoStore, 'entityMap', 'ids'));

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
