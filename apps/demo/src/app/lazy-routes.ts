import { Route } from '@angular/router';
import { FlightSearchComponent } from './flight-search/flight-search.component';
import { FlightSearchSimpleComponent } from './flight-search-data-service-simple/flight-search-simple.component';
import { FlightEditSimpleComponent } from './flight-search-data-service-simple/flight-edit-simple.component';
import { FlightSearchDynamicComponent } from './flight-search-data-service-dynamic/flight-search.component';
import { FlightEditDynamicComponent } from './flight-search-data-service-dynamic/flight-edit.component';
import { TodoStorageSyncComponent } from './todo-storage-sync/todo-storage-sync.component';
import { FlightSearchWithPaginationComponent } from './flight-search-with-pagination/flight-search-with-pagination.component';
import { FlightSearchReducConnectorComponent } from './flight-search-redux-connector/flight-search.component';
import { provideFlightStore } from './flight-search-redux-connector/+state/redux';
import { TodoComponent } from './devtools/todo.component';

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
    component: FlightSearchWithPaginationComponent,
  },
  { path: 'flight-edit-dynamic/:id', component: FlightEditDynamicComponent },
  { path: 'todo-storage-sync', component: TodoStorageSyncComponent },
  {
    path: 'flight-search-redux-connector',
    providers: [provideFlightStore()],
    component: FlightSearchReducConnectorComponent,
  },
  {
    path: 'reset',
    loadComponent: () =>
      import('./reset/todo.component').then((m) => m.TodoComponent),
  },
  {
    path: 'immutable-state',
    loadComponent: () =>
      import('./immutable-state/immutable-state.component').then(
        (m) => m.ImmutableStateComponent
      ),
  },
  {
    path: 'feature-factory',
    loadComponent: () =>
      import('./feature-factory/feature-factory.component').then(
        (m) => m.FeatureFactoryComponent
      ),
  },
];
