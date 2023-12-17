import { Routes } from "@angular/router";


export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'flight',
        pathMatch: 'full'
      },
      {
        path: 'flight',
        loadChildren: () => import('./flight')
      },
      {
        path: 'passenger',
        loadChildren: () => import('./passenger'),
        data: {
          temp: '2 Grad',
          preloading: true
        }
      }
    ]
  }
];

export default BOOKING_ROUTES;
