import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'demo-root',
  templateUrl: './app.component.html',
  imports: [
    MatTableModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
    RouterLink,
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatDrawer,
    MatDrawerContainer,
    MatDrawerContent,
  ],
  styles: `
    .container {
      display: inline;
    }
    .content {
    margin: 4em;
  }`,
})
export class AppComponent {}
