import { signalStore } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import { devtoolsTest } from './helpers';

describe('connect & send', () => {
  it(
    'should connect',
    devtoolsTest(({ connectSpy }) => {
      expect(connectSpy).toHaveBeenCalledTimes(1);
    })
  );

  it(
    'should not connect if Redux Devtools are not available',
    devtoolsTest({ extensionsAvailable: false }, ({ connectSpy }) => {
      expect(connectSpy).toHaveBeenCalledTimes(0);
    })
  );

  it(
    'should not connect if it runs on the server',
    devtoolsTest({ inSsr: true }, ({ connectSpy }) => {
      expect(connectSpy).toHaveBeenCalledTimes(0);
    })
  );

  it(
    'should only send when store is initialized',
    devtoolsTest({ createStore: false }, ({ sendSpy, runEffects }) => {
      expect(sendSpy).toHaveBeenCalledTimes(0);

      const Store = signalStore(withDevtools('flight'));
      runEffects();
      expect(sendSpy).toHaveBeenCalledTimes(0);

      new Store();
      runEffects();
      expect(sendSpy).toHaveBeenCalledTimes(1);
    })
  );
});
