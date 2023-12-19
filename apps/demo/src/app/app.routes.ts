import { Route } from '@angular/router';
import { TodoComponent } from './todo/todo.component';
import { FlightSearchComponent } from './flight-search/flight-search.component';

export const appRoutes: Route[] = [
  { path: 'todo', component: TodoComponent },
  { path: 'flight-search', component: FlightSearchComponent },
];
