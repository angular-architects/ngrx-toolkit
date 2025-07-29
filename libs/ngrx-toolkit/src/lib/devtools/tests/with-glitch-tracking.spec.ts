import {
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withGlitchTracking } from '../features/with-glitch-tracking';
import { renameDevtoolsName } from '../rename-devtools-name';
import { withDevtools } from '../with-devtools';
import { setupExtensions } from './helpers.spec';

describe('withGlitchTracking', () => {
  it('should sync immediately upon instantiation', () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(
      { providedIn: 'root' },
      withDevtools('counter', withGlitchTracking()),
      withState({ count: 0 })
    );

    expect(sendSpy).not.toHaveBeenCalled();
    TestBed.inject(Store);

    expect(sendSpy).toHaveBeenCalledWith(
      { type: 'Store Update' },
      { counter: { count: 0 } }
    );
  });

  it('should sync synchronous state changes', () => {
    const { sendSpy } = setupExtensions();

    const Store = signalStore(
      { providedIn: 'root' },
      withState({ count: 0 }),
      withDevtools('counter', withGlitchTracking()),
      withMethods((store) => ({
        increase: () =>
          patchState(store, (value) => ({ count: value.count + 1 })),
      }))
    );

    const store = TestBed.inject(Store);

    store.increase();
    store.increase();
    store.increase();
    TestBed.flushEffects();

    expect(sendSpy.mock.calls).toEqual([
      [{ type: 'Store Update' }, { counter: { count: 0 } }],
      [{ type: 'Store Update' }, { counter: { count: 1 } }],
      [{ type: 'Store Update' }, { counter: { count: 2 } }],
      [{ type: 'Store Update' }, { counter: { count: 3 } }],
    ]);
  });

  it('should support a mixed approach', () => {
    const { sendSpy } = setupExtensions();

    const GlitchFreeStore = signalStore(
      { providedIn: 'root' },
      withState({ count: 0 }),
      withDevtools('glitch-free counter'),
      withMethods((store) => ({
        increase: () =>
          patchState(store, (value) => ({ count: value.count + 1 })),
      }))
    );

    const GlitchStore = signalStore(
      { providedIn: 'root' },
      withState({ count: 0 }),
      withDevtools('glitch counter', withGlitchTracking()),
      withMethods((store) => ({
        increase: () =>
          patchState(store, (value) => ({ count: value.count + 1 })),
      }))
    );

    const glitchFreeStore = TestBed.inject(GlitchFreeStore);
    const glitchStore = TestBed.inject(GlitchStore);

    TestBed.flushEffects();
    for (let i = 0; i < 2; i++) {
      glitchFreeStore.increase();
      glitchStore.increase();
    }
    TestBed.flushEffects();

    expect(sendSpy.mock.calls).toEqual([
      [{ type: 'Store Update' }, { 'glitch counter': { count: 0 } }],
      [
        { type: 'Store Update' },
        { 'glitch-free counter': { count: 0 }, 'glitch counter': { count: 0 } },
      ],
      [
        { type: 'Store Update' },
        { 'glitch-free counter': { count: 0 }, 'glitch counter': { count: 1 } },
      ],
      [
        { type: 'Store Update' },
        { 'glitch-free counter': { count: 0 }, 'glitch counter': { count: 2 } },
      ],
      [
        { type: 'Store Update' },
        { 'glitch-free counter': { count: 2 }, 'glitch counter': { count: 2 } },
      ],
    ]);
  });

  it('two glitch stores should sync per change', () => {
    const { sendSpy } = setupExtensions();

    const GlitchStore1 = signalStore(
      { providedIn: 'root' },
      withState({ count: 0 }),
      withDevtools('glitch counter 1', withGlitchTracking()),
      withMethods((store) => ({
        increase: () =>
          patchState(store, (value) => ({ count: value.count + 1 })),
      }))
    );

    const GlitchStore2 = signalStore(
      { providedIn: 'root' },
      withState({ count: 0 }),
      withDevtools('glitch counter 2', withGlitchTracking()),
      withMethods((store) => ({
        increase: () =>
          patchState(store, (value) => ({ count: value.count + 1 })),
      }))
    );

    const glitchStore1 = TestBed.inject(GlitchStore1);
    const glitchStore2 = TestBed.inject(GlitchStore2);

    for (let i = 0; i < 2; i++) {
      glitchStore1.increase();
      glitchStore2.increase();
    }
    TestBed.flushEffects();

    expect(sendSpy.mock.calls).toEqual([
      [{ type: 'Store Update' }, { 'glitch counter 1': { count: 0 } }],
      [
        { type: 'Store Update' },
        { 'glitch counter 1': { count: 0 }, 'glitch counter 2': { count: 0 } },
      ],
      [
        { type: 'Store Update' },
        { 'glitch counter 1': { count: 1 }, 'glitch counter 2': { count: 0 } },
      ],
      [
        { type: 'Store Update' },
        { 'glitch counter 1': { count: 1 }, 'glitch counter 2': { count: 1 } },
      ],
      [
        { type: 'Store Update' },
        { 'glitch counter 1': { count: 2 }, 'glitch counter 2': { count: 1 } },
      ],
      [
        { type: 'Store Update' },
        { 'glitch counter 1': { count: 2 }, 'glitch counter 2': { count: 2 } },
      ],
    ]);
  });

  it('should not sync glitch-free if glitched is renamed', () => {
    const { sendSpy } = setupExtensions();

    const GlitchFreeStore = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight1')
    );

    const GlitchStore = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight2', withGlitchTracking())
    );

    TestBed.inject(GlitchFreeStore);
    const glitchStore = TestBed.inject(GlitchStore);

    TestBed.flushEffects();

    expect(sendSpy.mock.calls).toEqual([
      [{ type: 'Store Update' }, { flight2: { name: 'Product', price: 10.5 } }],
      [
        { type: 'Store Update' },
        {
          flight1: { name: 'Product', price: 10.5 },
          flight2: { name: 'Product', price: 10.5 },
        },
      ],
    ]);
    sendSpy.mockClear();

    renameDevtoolsName(glitchStore, 'flights2');
    TestBed.flushEffects();

    expect(sendSpy.mock.calls).toEqual([
      [
        { type: 'Store Update' },
        {
          flight1: { name: 'Product', price: 10.5 },
          flights2: { name: 'Product', price: 10.5 },
        },
      ],
    ]);
  });

  it('should not sync glitch tracker if glitch-free store is renamed', () => {
    const { sendSpy } = setupExtensions();

    const GlitchFreeStore = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('flight1')
    );

    const GlitchStore = signalStore(
      { providedIn: 'root' },
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('glitched Flights', withGlitchTracking())
    );

    const glitchFreeStore = TestBed.inject(GlitchFreeStore);
    TestBed.inject(GlitchStore);
    TestBed.flushEffects();

    sendSpy.mockClear();
    renameDevtoolsName(glitchFreeStore, 'glitch-free Flights');
    expect(sendSpy).not.toHaveBeenCalled();
    TestBed.flushEffects();

    expect(sendSpy.mock.calls).toEqual([
      [
        { type: 'Store Update' },
        {
          'glitch-free Flights': { name: 'Product', price: 10.5 },
          'glitched Flights': { name: 'Product', price: 10.5 },
        },
      ],
    ]);
  });

  it('should destroy watcher if store is destroyed', () => {
    const { sendSpy } = setupExtensions();

    const GlitchStore = signalStore(
      withState({ name: 'Product', price: 10.5 }),
      withDevtools('Glitched Store', withGlitchTracking())
    );

    const childContext = createEnvironmentInjector(
      [GlitchStore],
      TestBed.inject(EnvironmentInjector)
    );
    runInInjectionContext(childContext, () => inject(GlitchStore));

    expect(sendSpy).toHaveBeenCalled();
    sendSpy.mockClear();
    childContext.destroy();
    expect(sendSpy).toHaveBeenCalledWith({ type: 'Store Update' }, {});
  });
});
