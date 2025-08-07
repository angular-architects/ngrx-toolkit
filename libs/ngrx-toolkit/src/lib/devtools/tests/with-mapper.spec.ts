import { TestBed } from '@angular/core/testing';
import { signalStore, withState } from '@ngrx/signals';
import { withMapper } from '../features/with-mapper';
import { withDevtools } from '../with-devtools';
import { setupExtensions } from './helpers.spec';

function domRemover(state: Record<string, unknown>) {
  return Object.keys(state).reduce((acc, key) => {
    const value = state[key];

    if (value instanceof HTMLElement) {
      return acc;
    } else {
      return { ...acc, [key]: value };
    }
  }, {});
}

describe('with-mapper', () => {
  it('should remove DOM Nodes', () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(
      { providedIn: 'root' },
      withState({
        name: 'Car',
        carElement: document.createElement('div'),
      }),
      withDevtools('shop', withMapper(domRemover)),
    );

    TestBed.inject(Store);
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { shop: { name: 'Car' } },
    );
  });

  it('should every property ending with *Key', () => {
    const { sendSpy } = setupExtensions();
    const Store = signalStore(
      { providedIn: 'root' },
      withState({
        name: 'Car',
        unlockKey: '1234',
      }),
      withDevtools(
        'shop',
        withMapper((state: Record<string, unknown>) =>
          Object.keys(state).reduce((acc, key) => {
            if (key.endsWith('Key')) {
              return acc;
            } else {
              return { ...acc, [key]: state[key] };
            }
          }, {}),
        ),
      ),
    );

    TestBed.inject(Store);
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { shop: { name: 'Car' } },
    );
  });
});
