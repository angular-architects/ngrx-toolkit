import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import {
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { Todo, TodoMemoryService } from './todo-memory.service';

function respond<T>(req: HttpRequest<unknown>, body: T): HttpResponse<T> {
  return new HttpResponse<T>({
    url: req.url,
    status: 200,
    statusText: 'OK',
    body,
  });
}

export const memoryHttpInterceptor: HttpInterceptorFn = (
  req,
  next,
): Observable<HttpEvent<unknown>> => {
  const match = req.url.match(/\/memory\/(add|toggle|remove)(?:\/(\d+))?/);
  if (!match) return next(req);

  // Ensure we resolve service inside an injection context
  const env = inject(EnvironmentInjector);
  const svc = runInInjectionContext(env, () => inject(TodoMemoryService));

  const action = match[1];
  const idPart = match[2];

  switch (action) {
    case 'add': {
      const todo = req.body as Todo;
      return svc
        .add(todo)
        .pipe(switchMap((t) => of(respond(req, t) as HttpEvent<unknown>)));
    }
    case 'toggle': {
      const id = Number(idPart);
      const completed = (req.body as { completed: boolean }).completed;
      return svc.toggle(id, completed).pipe(
        switchMap((t) => {
          if (t) {
            return of(respond(req, t) as HttpEvent<unknown>);
          }
          const err = new HttpErrorResponse({ url: req.url, status: 404 });
          throw err;
        }),
      );
    }
    case 'remove': {
      const id = Number(idPart);
      return svc
        .remove(id)
        .pipe(switchMap((ok) => of(respond(req, ok) as HttpEvent<unknown>)));
    }
    default:
      return next(req);
  }
};
