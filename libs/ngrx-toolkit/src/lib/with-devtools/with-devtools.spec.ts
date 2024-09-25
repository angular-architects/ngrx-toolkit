import { signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import SpyInstance = jest.SpyInstance;
import Mock = jest.Mock;
import { Action, withDevtools, reset } from './with-devtools';
import { DevtoolsConfig, provideStoreDevtoolsConfig } from './with-devtools.config';

type Flight = {
  id: number;
  from: string;
  to: string;
  date: Date;
  delayed: boolean;
};

let currentFlightId = 1;

const createFlight = (flight: Partial<Flight> = {}) => ({
  ...{
    id: ++currentFlightId,
    from: 'Vienna',
    to: 'London',
    date: new Date(2024, 2, 1),
    delayed: false,
  },
  ...flight,
});

interface SetupOptions {
  extensionsAvailable: boolean;
  inSsr: boolean;
  config: DevtoolsConfig | null;
}

interface TestData {
  store: unknown;
  connectSpy: Mock;
  sendSpy: SpyInstance;
  runEffects: () => void;
}

function run(
  fn: (testData: TestData) => void,
  options: Partial<SetupOptions> = {}
): any {
  return () => {
    const defaultOptions: SetupOptions = {
      inSsr: false,
      extensionsAvailable: true,
      config: null,
    };
    const realOptions = { ...defaultOptions, ...options };

    const sendSpy = jest.fn<void, [Action, Record<string, unknown>]>();
    const connection = {
      send: sendSpy,
    };
    const connectSpy = jest.fn(() => connection);
    window.__REDUX_DEVTOOLS_EXTENSION__ = { connect: connectSpy };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: PLATFORM_ID,
          useValue: realOptions.inSsr ? 'server' : 'browser',
        },
        ...(realOptions.config ? [provideStoreDevtoolsConfig(realOptions.config)] : []),
      ],
    });

    if (!realOptions.extensionsAvailable) {
      window.__REDUX_DEVTOOLS_EXTENSION__ = undefined;
    }

    TestBed.runInInjectionContext(() => {
      const Store = signalStore(
        withEntities<Flight>(),
        withDevtools('flights')
      );
      const store = new Store();
      fn({
        connectSpy,
        sendSpy,
        store,
        runEffects: () => TestBed.flushEffects(),
      });
      reset();
    });
  };
}

describe('Devtools', () => {
  it(
    'should connection',
    run(({ connectSpy }) => {
      expect(connectSpy).toHaveBeenCalledTimes(1);
    })
  );

  it(
    'should not connect if no Redux Devtools are available',
    run(
      ({ connectSpy }) => {
        expect(connectSpy).toHaveBeenCalledTimes(0);
      },
      { extensionsAvailable: false }
    )
  );

  it(
    'should not connect if it runs on the server',
    run(
      ({ connectSpy }) => {
        expect(connectSpy).toHaveBeenCalledTimes(0);
      },
      { inSsr: true }
    )
  );

  it(
    'should not connect if it runs in logOnly mode',
    run(
      ({ connectSpy }) => {
        expect(connectSpy).toHaveBeenCalledTimes(0);
      },
      { config: { logOnly: true } }
    )
  );

  it(
    'should connect if it runs with config and logOnly=false',
    run(
      ({ connectSpy }) => {
        expect(connectSpy).toHaveBeenCalledTimes(1);
      },
      { config: { logOnly: false } }
    )
  );

  it(
    'should dispatch todo state',
    run(({ sendSpy, runEffects }) => {
      runEffects();
      expect(sendSpy).toHaveBeenCalledWith(
        { type: 'Store Update' },
        { flights: { entityMap: {}, ids: [] } }
      );
    })
  );

  it.skip(
    'add multiple store as feature stores',
    run(({ runEffects, sendSpy }) => {
      signalStore(withDevtools('category'));
      signalStore(withDevtools('bookings'));
      runEffects();
      const [, state] = sendSpy.mock.calls[0];
      expect(Object.keys(state)).toContainEqual([
        'category',
        'bookings',
        'flights',
      ]);
    })
  );

  it.todo('should only send when store is initalisaed');
  it.todo('should removed state once destroyed');
  it.todo('should allow to set name afterwards');
  it.todo('should allow to run with names');
  it.todo('should provide a patch method with action names');
  it.todo('should index store names by default');
  it.todo('should fail, if indexing is disabled');
  it.todo('should work with a signalStore added lazily, i.e. after a CD cycle');
  it.todo('should patchState with action name');
  it.todo('should use patchState with default action name');
  it.todo('should group multiple patchStates (glitch-free) in one action');
});
