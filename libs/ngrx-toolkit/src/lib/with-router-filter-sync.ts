import { effect, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals';
import { Filter } from './with-data-service';

export function withRouterFilterSync<F extends Filter>() {
  return signalStoreFeature(
    {
      state: type<{ filter: F }>(),
    },
    withHooks({
      onInit(store) {
        const router = inject(Router)
        const route = inject(ActivatedRoute)
        const filterKeys = Object.keys(store.filter());
        const queryParams = route.snapshot.queryParams;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter = filterKeys.reduce((acc: any, key: string) => {
          if (queryParams['hasOwn'](key)) {
            acc[key] = queryParams[key];
          }
          return acc;
        }, {} as F);

        patchState(store, { filter });

        effect(() => {
          router.navigate([], {
            relativeTo: route,
            queryParams: store.filter(),
            queryParamsHandling: 'merge',
          });
        });
      },
    })
  );
}
