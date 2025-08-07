import { computed, inject } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  patchState,
  signalStore,
  type,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { addEntity, withEntities } from '@ngrx/signals/entities';
import { withCallState } from './with-call-state';
import { withUndoRedo } from './with-undo-redo';

const testState = { test: '' };
const testKeys = ['test' as const];
const newValue = 'new value';
const newerValue = 'newer value';

describe('withUndoRedo', () => {
  it('adds methods for undo, redo, canUndo, canRedo', () => {
    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withState(testState),
        withUndoRedo({ keys: testKeys }),
      );
      const store = new Store();

      expect(Object.keys(store)).toEqual([
        'test',
        'canUndo',
        'canRedo',
        'undo',
        'redo',
        'clearStack',
      ]);
    });
  });

  it('should check keys and collection types', () => {
    signalStore(
      withState(testState),
      // @ts-expect-error - should not allow invalid keys
      withUndoRedo({ keys: ['tes'] }),
    );
    signalStore(
      withState(testState),
      withEntities({ entity: type(), collection: 'flight' }),
      // @ts-expect-error - should not allow invalid keys when entities are present
      withUndoRedo({ keys: ['flightIdsTest'] }),
    );
    signalStore(
      withState(testState),
      // @ts-expect-error - should not allow collections without named entities
      withUndoRedo({ collections: ['tee'] }),
    );
    signalStore(
      withState(testState),
      withComputed((store) => ({ testComputed: computed(() => store.test()) })),
      // @ts-expect-error - should not allow collections without named entities with other computed
      withUndoRedo({ collections: ['tested'] }),
    );
    signalStore(
      withEntities({ entity: type() }),
      // @ts-expect-error - should not allow collections without named entities
      withUndoRedo({ collections: ['test'] }),
    );
    signalStore(
      withEntities({ entity: type(), collection: 'flight' }),
      // @ts-expect-error - should not allow invalid collections
      withUndoRedo({ collections: ['test'] }),
    );
  });

  describe('undo and redo', () => {
    it('restores previous state for regular store key', fakeAsync(() => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(
          withState(testState),
          withMethods((store) => ({
            updateTest: (newTest: string) =>
              patchState(store, { test: newTest }),
          })),
          withUndoRedo({ keys: testKeys }),
        );

        const store = new Store();
        tick(1);

        store.updateTest(newValue);
        tick(1);
        expect(store.test()).toEqual(newValue);
        expect(store.canUndo()).toBe(true);
        expect(store.canRedo()).toBe(false);

        store.undo();
        tick(1);

        expect(store.test()).toEqual('');
        expect(store.canUndo()).toBe(false);
        expect(store.canRedo()).toBe(true);
      });
    }));

    it('restores previous state for regular store key and respects skip', fakeAsync(() => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(
          withState(testState),
          withMethods((store) => ({
            updateTest: (newTest: string) =>
              patchState(store, { test: newTest }),
          })),
          withUndoRedo({ keys: testKeys, skip: 1 }),
        );

        const store = new Store();
        tick(1);

        store.updateTest(newValue);
        tick(1);
        expect(store.test()).toEqual(newValue);

        store.updateTest(newerValue);
        tick(1);

        store.undo();
        tick(1);

        expect(store.test()).toEqual(newValue);
        expect(store.canUndo()).toBe(false);

        store.undo();
        tick(1);

        // should not change
        expect(store.test()).toEqual(newValue);
      });
    }));

    it('undoes and redoes previous state for entity', fakeAsync(() => {
      const Store = signalStore(
        withEntities({ entity: type<{ id: string }>() }),
        withMethods((store) => ({
          addEntity: (newTest: string) =>
            patchState(store, addEntity({ id: newTest })),
        })),
        withUndoRedo(),
      );
      TestBed.configureTestingModule({ providers: [Store] });
      TestBed.runInInjectionContext(() => {
        const store = inject(Store);
        tick(1);
        expect(store.entities()).toEqual([]);
        expect(store.canUndo()).toBe(false);
        expect(store.canRedo()).toBe(false);

        store.addEntity(newValue);
        tick(1);
        expect(store.entities()).toEqual([{ id: newValue }]);
        expect(store.canUndo()).toBe(true);
        expect(store.canRedo()).toBe(false);

        store.addEntity(newerValue);
        tick(1);
        expect(store.entities()).toEqual([
          { id: newValue },
          { id: newerValue },
        ]);
        expect(store.canUndo()).toBe(true);
        expect(store.canRedo()).toBe(false);

        store.undo();

        expect(store.entities()).toEqual([{ id: newValue }]);
        expect(store.canUndo()).toBe(true);
        expect(store.canRedo()).toBe(true);

        store.undo();

        expect(store.entities()).toEqual([]);
        expect(store.canUndo()).toBe(false);
        expect(store.canRedo()).toBe(true);

        store.redo();
        tick(1);

        expect(store.entities()).toEqual([{ id: newValue }]);
        expect(store.canUndo()).toBe(true);
        expect(store.canRedo()).toBe(true);

        // should return canRedo=false after a change
        store.addEntity('newest');
        tick(1);
        expect(store.canUndo()).toBe(true);
        expect(store.canRedo()).toBe(false);
      });
    }));

    it('restores previous state for named entity', fakeAsync(() => {
      TestBed.runInInjectionContext(() => {
        const Store = signalStore(
          withEntities({
            entity: type<{ id: string }>(),
            collection: 'flight',
          }),
          withMethods((store) => ({
            addEntity: (newTest: string) =>
              patchState(
                store,
                addEntity({ id: newTest }, { collection: 'flight' }),
              ),
          })),
          withCallState({ collection: 'flight' }),
          withUndoRedo({ collections: ['flight'] }),
        );

        const store = new Store();
        tick(1);

        store.addEntity(newValue);
        tick(1);
        expect(store.flightEntities()).toEqual([{ id: newValue }]);
        expect(store.canUndo()).toBe(true);
        expect(store.canRedo()).toBe(false);

        store.undo();
        tick(1);

        expect(store.flightEntities()).toEqual([]);
        expect(store.canUndo()).toBe(false);
        expect(store.canRedo()).toBe(true);
      });
    }));

    it('clears undo redo stack', () => {
      const Store = signalStore(
        { providedIn: 'root' },
        withState(testState),
        withMethods((store) => ({
          update: (value: string) => patchState(store, { test: value }),
        })),
        withUndoRedo({ keys: testKeys }),
      );

      const store = TestBed.inject(Store);

      store.update('Foo');
      store.update('Bar');
      store.undo();
      store.clearStack();

      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);
    });

    it('cannot undo after clearing and setting a new value', fakeAsync(() => {
      const Store = signalStore(
        { providedIn: 'root' },
        withState(testState),
        withMethods((store) => ({
          update: (value: string) => patchState(store, { test: value }),
        })),
        withUndoRedo({ keys: testKeys }),
      );

      const store = TestBed.inject(Store);

      store.update('Alan');
      tick(1);

      store.update('Gordon');
      tick(1);

      store.clearStack();
      tick(1);

      // After clearing the undo/redo stack, there is no previous item anymore.
      // The following update becomes the first value.
      // Since there is no other value before, it cannot be undone.
      store.update('Hugh');
      tick(1);

      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);
    }));
  });
});
