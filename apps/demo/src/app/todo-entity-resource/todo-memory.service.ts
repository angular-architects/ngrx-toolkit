import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TodoMemoryService {
  private readonly todos$ = new BehaviorSubject<Todo[]>([
    { id: 1, title: 'Buy milk', completed: false },
    { id: 2, title: 'Walk the dog', completed: true },
  ]);

  list(): Observable<Todo[]> {
    return this.todos$.asObservable();
  }

  add(todo: Todo): Observable<Todo> {
    const list = this.todos$.value.slice();
    list.push(todo);
    this.todos$.next(list);
    return of(todo);
  }

  toggle(id: number, completed: boolean): Observable<Todo | undefined> {
    const list = this.todos$.value.slice();
    const idx = list.findIndex((t) => t.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], completed };
      this.todos$.next(list);
      return of(list[idx]);
    }
    return of(undefined);
  }

  remove(id: number): Observable<boolean> {
    const list = this.todos$.value.slice();
    const filtered = list.filter((t) => t.id !== id);
    this.todos$.next(filtered);
    return of(true);
  }
}
