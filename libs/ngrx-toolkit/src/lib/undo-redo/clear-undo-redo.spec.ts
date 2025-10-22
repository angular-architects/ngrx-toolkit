import { TestBed } from '@angular/core/testing';
import { signalStore, withState } from '@ngrx/signals';
import { clearUndoRedo } from './clear-undo-redo';
import { withUndoRedo } from './with-undo-redo';

describe('withUndoRedo', () => {
  describe('clearUndoRedo', () => {
    it('should throw an error if the store is not configured with withUndoRedo()', () => {
      const Store = signalStore({ providedIn: 'root' }, withState({}));
      const store = TestBed.inject(Store);

      expect(() => clearUndoRedo(store)).toThrow(
        'Cannot clear undoRedo, since store is not configured with withUndoRedo()',
      );
    });

    it('should not throw no error if the store is configured with withUndoRedo()', () => {
      const Store = signalStore(
        { providedIn: 'root' },
        withState({}),
        withUndoRedo(),
      );
      const store = TestBed.inject(Store);

      expect(() => clearUndoRedo(store)).not.toThrow();
    });
  });
});
