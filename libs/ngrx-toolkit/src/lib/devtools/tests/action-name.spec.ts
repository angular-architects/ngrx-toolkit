import { TestBed } from '@angular/core/testing';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { updateState } from '../update-state';
import { withDevtools } from '../with-devtools';
import { setupExtensions } from './helpers.spec';

describe('updateState', () => {
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

    const Store = signalStore(
      { providedIn: 'root' },
      withDevtools('shop'),
      withState({ name: 'Car' }),
      withMethods((store) => ({
        setName(name: string) {
          updateState(store, 'Set Name', { name });
        },
      }))
    );
    const store = TestBed.inject(Store);
    TestBed.flushEffects();

    store.setName('i4');
    TestBed.flushEffects();

    expect(sendSpy).lastCalledWith(
      { type: 'Set Name' },
      { shop: { name: 'i4' } }
    );
  });
});
