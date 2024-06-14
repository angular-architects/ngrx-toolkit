import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () => import('./lazy-routes').then((m) => m.lazyRoutes),
  },
];
