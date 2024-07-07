import { filter, interval, Observable, pipe, switchMap, tap } from 'rxjs';
import {
  patchState,
  signalStore,
  signalStoreFeature,
  type,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Person {
  firstname: string;
  lastname: string;
}

function withEntityVersioner<Entity>() {
  return signalStoreFeature(
    { methods: type<{ loader: () => Observable<Entity[]> }>() },
    withState({ version: 1, entities: new Array<Entity>() }),
    withMethods((store) => {
      return {
        update: rxMethod<unknown>(
          pipe(
            switchMap(() => store.loader()),
            filter((entities) => entities !== store.entities()),
            tap((entities) =>
              patchState(store, (value) => ({
                entities,
                version: value.version + 1,
              }))
            )
          )
        ),
      };
    }),
    withHooks((store) => ({ onInit: () => store.update(interval(1000)) }))
  );
}

signalStore(
  withMethods(() => {
    const httpClient = inject(HttpClient);
    return {
      loader() {
        return httpClient.get<Person[]>('someUrl');
      },
    };
  }),
  withEntityVersioner() // does not compile
);
