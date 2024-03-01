import { Route } from '@angular/router';
import { provideFlightStore } from './flight-search-redux-connector/+state/redux';

export const appRoutes: Route[] = [
  { path: 'todo', loadComponent: () => import('./todo/todo.component').then(m => m.TodoComponent) },
  { path: 'flight-search', loadComponent: () => import('./flight-search/flight-search.component').then(m => m.FlightSearchComponent) },
  {
    path: 'flight-search-data-service-simple',
    loadComponent: () => import('./flight-search-data-service-simple/flight-search-simple.component').then(m => m.FlightSearchSimpleComponent)
  },
  { path: 'flight-edit-simple/:id', loadComponent: () => import('./flight-search-data-service-simple/flight-edit-simple.component').then(m => m.FlightEditSimpleComponent) },
  {
    path: 'flight-search-data-service-dynamic',
    loadComponent: () => import('./flight-search-data-service-dynamic/flight-search.component').then(m => m.FlightSearchDynamicComponent)
  },
  { path: 'flight-edit-dynamic/:id', loadComponent: () => import('./flight-search-data-service-dynamic/flight-edit.component').then(m => m.FlightEditDynamicComponent) },
  { path: 'todo-storage-sync', loadComponent: () => import('./todo-storage-sync/todo-storage-sync.component').then(m => m.TodoStorageSyncComponent) },
  {
    path: 'flight-search-redux-connector',
    providers: [provideFlightStore()],
    loadComponent: () => import('./flight-search-redux-connector/flight-search.component').then(m => m.FlightSearchReducConnectorComponent)
  },
];
