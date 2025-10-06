import { SelectionModel } from '@angular/cdk/collections';
import { Component, effect, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Todo } from '../shared/todo.service';
import { TodoStore } from './todo-store';

@Component({
  template: `
    <h2><code>withReset</code> Todo List</h2>

    <button mat-raised-button (click)="resetState()" type="button">
      Reset State
    </button>

    <section>
      <mat-table [dataSource]="dataSource" class="mat-elevation-z8">
        <!-- Checkbox Column -->
        <ng-container matColumnDef="finished">
          <mat-header-cell *matHeaderCellDef />
          <mat-cell *matCellDef="let row" class="actions">
            <mat-checkbox
              (click)="$event.stopPropagation()"
              (change)="toggleFinished(row)"
              [checked]="row.finished"
            />
          </mat-cell>
        </ng-container>

        <!-- Name Column -->
        <ng-container matColumnDef="name">
          <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
          <mat-cell *matCellDef="let element">{{ element.name }}</mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="displayedColumns" />
        <mat-row
          *matRowDef="let row; columns: displayedColumns"
          (click)="selection.toggle(row)"
        />
      </mat-table>
    </section>
  `,
  styles: `
    button {
      margin-bottom: 1em;
    }
  `,
  imports: [MatCheckboxModule, MatIconModule, MatTableModule, MatButton],
})
export class TodoComponent {
  todoStore = inject(TodoStore);

  displayedColumns = ['finished', 'name'] as const;
  dataSource = new MatTableDataSource<Todo>([]);
  selection = new SelectionModel<Todo>(true, []);

  constructor() {
    effect(() => {
      this.dataSource.data = this.todoStore.entities();
    });
  }

  toggleFinished(todo: Todo) {
    this.todoStore.toggleFinished(todo.id);
  }

  resetState() {
    this.todoStore.resetState();
  }
}
