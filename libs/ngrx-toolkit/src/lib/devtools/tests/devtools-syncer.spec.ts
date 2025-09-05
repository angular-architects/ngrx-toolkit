import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DevtoolsSyncer } from '../internal/devtools-syncer.service';
import { Tracker } from '../internal/models';

describe('DevtoolsSyncer integration with Redux DevTools', () => {
  let connectSpy: jest.Mock;
  let sendSpy: jest.Mock;

  beforeEach(() => {
    sendSpy = jest.fn();
    connectSpy = jest.fn(() => ({ send: sendSpy }));
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ = { connect: connectSpy };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
  });

  function createTrackerMock(): Tracker {
    const onChangeMock = jest.fn();

    return {
      onChange: onChangeMock,
      track: jest.fn(),
      removeStore: jest.fn(),
      notifyRenamedStore: jest.fn(),
      get stores() {
        return {}; // Return an empty object or mock stores as needed
      },
    };
  }

  it('should send valid state and action type to DevTools', () => {
    const syncer = TestBed.inject(DevtoolsSyncer);
    const id = syncer.getNextId();
    const tracker = createTrackerMock();

    (tracker.onChange as jest.Mock).mockImplementation((cb) => {
      cb({ [id]: { count: 42 } });
    });

    syncer.addStore(id, 'CounterStore', {} as any, {
      map: (s: object) => s,
      tracker,
      indexNames: false,
    });

    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Store Update' }),
      expect.objectContaining({ CounterStore: { count: 42 } }),
    );
  });

  it('should not send empty state or type', () => {
    const syncer = TestBed.inject(DevtoolsSyncer);
    const id = syncer.getNextId();
    const tracker = createTrackerMock();

    (tracker.onChange as jest.Mock).mockImplementation((cb) => {
      cb({ [id]: {} });
    });

    syncer.addStore(id, 'EmptyStore', {} as any, {
      map: (s: object) => s,
      tracker,
      indexNames: false,
    });

    const [action, state] = sendSpy.mock.calls[0];
    expect(action.type).toBe('Store Update');
    expect(state.EmptyStore).toEqual({});
  });

  it('should handle extension absence gracefully', () => {
    delete (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    const warnSpy = jest.spyOn(console, 'warn');
    TestBed.inject(DevtoolsSyncer);

    expect(warnSpy).toHaveBeenCalledWith(
      '[DevtoolsSyncer] Redux DevTools extension not found.',
    );
    warnSpy.mockRestore();
  });

  it('should not send if not in browser', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    TestBed.inject(DevtoolsSyncer);
    expect(connectSpy).not.toHaveBeenCalled();
  });
});
