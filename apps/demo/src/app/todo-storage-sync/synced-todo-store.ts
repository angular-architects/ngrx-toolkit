import { patchState, signalStore, withHooks, withMethods } from '@ngrx/signals';
import {
  withEntities,
  setEntity,
  removeEntity,
  updateEntity,
} from '@ngrx/signals/entities';
import { AddTodo, Todo } from '../devtools/todo-store';
import {
  withIndexedDB,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';

export const SyncedTodoStore = signalStore(
  { providedIn: 'root' },
  withEntities<Todo>(),
  withStorageSync(
    {
      dbName: 'ngrx-toolkit',
      storeName: 'todo',
      parse: (value: string) => JSON.parse(value),
    },
    withIndexedDB()
  ),
  withMethods((store) => {
    let currentId = 0;
    return {
      add(todo: AddTodo) {
        patchState(store, setEntity({ id: ++currentId, ...todo }));
      },

      remove(id: number) {
        patchState(store, removeEntity(id));
      },

      toggleFinished(id: number): void {
        const todo = store.entityMap()[id];
        patchState(
          store,
          updateEntity({ id, changes: { finished: !todo.finished } })
        );
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.add({
        name: 'Go for a Walk',
        finished: false,
        description:
          'Go for a walk in the park to relax and enjoy nature. Walking is a great way to clear your mind and get some exercise. It can help reduce stress and improve your mood. Make sure to wear comfortable shoes and bring a bottle of water. Enjoy the fresh air and take in the scenery around you.',
      });

      store.add({
        name: 'Read a Book',
        finished: false,
        description:
          'Spend some time reading a book. It can be a novel, a non-fiction book, or any other genre you enjoy. Reading can help you relax and learn new things.',
      });

      store.add({
        name: 'Write a Journal',
        finished: false,
        description:
          'Take some time to write in your journal. Reflect on your day, your thoughts, and your feelings. Journaling can be a great way to process emotions and document your life.',
      });

      store.add({
        name: 'Exercise',
        finished: false,
        description:
          'Do some physical exercise. It can be a workout, a run, or any other form of exercise you enjoy. Exercise is important for maintaining physical and mental health.',
      });

      store.add({
        name: 'Cook a Meal',
        finished: false,
        description:
          'Prepare a meal for yourself or your family. Cooking can be a fun and rewarding activity. Try out a new recipe or make one of your favorite dishes.',
      });
    },
  })
);
