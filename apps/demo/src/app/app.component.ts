import { SelectionModel } from '@angular/cdk/collections';
import { Component, effect, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Todo, TodoStore } from './todo-store';
import { MatIconModule } from '@angular/material/icon';
import { CategoryStore } from './category.store';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListItem, MatListModule } from '@angular/material/list';

@Component({
  selector: 'demo-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    MatTableModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
    RouterLink,
    RouterOutlet,
    SidebarComponent,
    CommonModule,
    MatToolbarModule,
  ],
})
export class AppComponent {}
