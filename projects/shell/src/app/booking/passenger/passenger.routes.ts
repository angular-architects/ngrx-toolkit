import { Routes } from "@angular/router";
import { PassengerSearchComponent } from "./features/passenger-search/passenger-search.component";
import { PassengerEditComponent } from "./features/passenger-edit/passenger-edit.component";


export const PASSENGER_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'search',
        pathMatch: 'full'
      },
      {
        path: 'search',
        component: PassengerSearchComponent,
      },
      {
        path: 'edit/:id',
        component: PassengerEditComponent
      }
    ]
  }

];

export default PASSENGER_ROUTES;
