import { Route } from '@angular/router';
import { TodoComponent } from './todo/todo.component';
import { FlightSearchComponent } from './flight-search/flight-search.component';
import { FlightSearchSimpleComponent } from './flight-search-data-service-simple/flight-search-simple.component';
import { FlightEditSimpleComponent } from './flight-search-data-service-simple/flight-edit-simple.component';
import { FlightSearchDynamicComponent } from './flight-search-data-service-dynamic/flight-search.component';
import { FlightEditDynamicComponent } from './flight-search-data-service-dynamic/flight-edit.component';
import { TodoStorageSyncComponent } from './todo-storage-sync/todo-storage-sync.component';
import { provideFlightStore } from './flight-search-redux-connector/+state/redux';
import { FlightSearchReducConnectorComponent } from './flight-search-redux-connector/flight-search.component';
import { FlightSearchWithPaginationComponent } from './flight-search-with-pagination/flight-search-with-pagination.component';

export const lazyRoutes: Route[] = [
  { path: 'todo', component: TodoComponent },
  { path: 'flight-search', component: FlightSearchComponent },
  {
    path: 'flight-search-data-service-simple',
    component: FlightSearchSimpleComponent,
  },
  { path: 'flight-edit-simple/:id', component: FlightEditSimpleComponent },
  {
    path: 'flight-search-data-service-dynamic',
    component: FlightSearchDynamicComponent,
  },
  {
    path: 'flight-search-with-pagination',
    component: FlightSearchWithPaginationComponent
  },
  { path: 'flight-edit-dynamic/:id', component: FlightEditDynamicComponent },
  { path: 'todo-storage-sync', component: TodoStorageSyncComponent },
  {
    path: 'flight-search-redux-connector',
    providers: [provideFlightStore()],
    component: FlightSearchReducConnectorComponent,
  },
];
