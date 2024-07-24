import { setupExtensions } from './helpers';
import { TestBed } from '@angular/core/testing';
import { signalStore, withState } from '@ngrx/signals';
import { updateState, withDevtools } from 'ngrx-toolkit';

describe('tkPatchState', () => {
  it('should show the name of the action', () => {
    const { sendSpy } = setupExtensions();
    TestBed.inject(
      signalStore(
        { providedIn: 'root' },
        withDevtools('shop'),
        withState({ name: 'Car' })
      )
    );
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { shop: { name: 'Car' } }
    );
  });

  it('should set the action name', () => {
    const { sendSpy } = setupExtensions();
    const store = TestBed.inject(
      signalStore(
        { providedIn: 'root' },
        withDevtools('shop'),
        withState({ name: 'Car' })
      )
    );
    TestBed.flushEffects();

    updateState(store, 'Set Name', { name: 'i4' });
    TestBed.flushEffects();

    expect(sendSpy).lastCalledWith(
      { type: 'Set Name' },
      { shop: { name: 'i4' } }
    );
  });
});
