import { signalStore, withState } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import { TestBed } from '@angular/core/testing';
import { Component, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { devtoolsTest, setupExtensions } from './helpers';

/**
 * In order to test store instances with destroy hooks, a store
 * providedIn root would fail, because it doesn't get access to
 * the Injection Context (TestBed resets outside of Injection Context).
 *
 * That's why, we have to create an artificial component, where
 * the Store is provided, thus creating a nested Injection Context.
 *
 * Once the test ends, the router switch to another component which
 * causes the store to be destroyed.
 */

describe('Devtools', () => {
  it(
    'should dispatch todo state',
    devtoolsTest(async ({ sendSpy, runEffects }) => {
      runEffects();
      expect(sendSpy).toHaveBeenCalledWith(
        { type: 'Store Update' },
        { flight: { entityMap: {}, ids: [] } }
      );
    })
  );

  it(
    'add multiple store as feature stores',
    devtoolsTest(async ({ runEffects, sendSpy }) => {
      for (const name of ['category', 'booking']) {
        const Store = signalStore(withDevtools(name));
        new Store();
      }
      runEffects();
      expect(sendSpy).toHaveBeenLastCalledWith({ type: 'State Update' }, [
        'flight',
        'category',
        'booking',
      ]);
    })
  );

  it('should remove the state once destroyed', async () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(withDevtools('flight'));

    @Component({
      selector: 'app-flight-search',
      template: ``,
      standalone: true,
      providers: [Store],
    })
    class FlightSearchComponent {
      store = inject(Store);
    }

    @Component({ selector: 'app-home', template: ``, standalone: true })
    class HomeComponent {}

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: HomeComponent },
          { path: 'flight', component: FlightSearchComponent },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create('flight');
    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { flight: {} }
    );
    await harness.navigateByUrl('/');
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledWith({ type: 'Store Update' }, {});
  });

  it(
    'should index unique names',
    devtoolsTest(async ({ runEffects, sendSpy }) => {
      const Store = signalStore(withState({}), withDevtools('flight'));
      new Store();
      runEffects();
      expect(sendSpy.mock).toHaveBeenCalledWith(
        { type: 'State Update' },
        { flight: {}, 'flight-1': {} }
      );
      expect(true).toBe(false);
    })
  );
  it.todo('should provide a patch method with action names');
  it.todo('should index store names by default');
  it.todo('should fail, if indexing is disabled');
  it.todo('should work with a signalStore added lazily, i.e. after a CD cycle');
  it.todo('should patchState with action name');
  it.todo('should use patchState with default action name');
  it.todo('should group multiple patchStates (glitch-free) in one action');
  it.todo('should not run if in prod mode');
  it.todo('should allow time-travel (revert state via devtools');
  it.todo('should clear actionNames automatically onDestroy');
});
