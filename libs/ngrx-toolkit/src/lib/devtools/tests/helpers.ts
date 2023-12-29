import { Action, withDevtools } from '../with-devtools';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { signalStore, withState } from '@ngrx/signals';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { jest } from '@jest/globals';

interface SetupOptions {
  extensionsAvailable: boolean;
  inSsr: boolean;
  createStore: boolean;
}

interface TestData {
  store: unknown;
  connectSpy: jest.Mock;
  sendSpy: jest.Mock<(action: Action, state: Record<string, unknown>) => void>;
  runEffects: () => void;
}

export type Flight = {
  id: number;
  from: string;
  to: string;
  date: Date;
  delayed: boolean;
};

function assertNotNull<T>(obj: T): asserts obj is NonNullable<T> {
  if (obj === null || obj === undefined) {
    throw new Error('value cannot be null or undefined');
  }
}

export function setupExtensions() {
  const sendSpy = jest.fn();
  const connection = {
    send: sendSpy,
  };
  const connectSpy = jest.fn(() => connection);
  window.__REDUX_DEVTOOLS_EXTENSION__ = { connect: connectSpy };

  return { sendSpy, connectSpy };
}

function setupTestRouting(StoreClass: undefined | (new () => unknown)) {
  @Component({
    selector: 'app-test',
    standalone: true,
    template: '',
    providers: StoreClass ? [StoreClass] : [],
  })
  class TestComponent {
    constructor() {
      if (StoreClass) {
        inject(StoreClass);
      }
    }
  }

  @Component({ selector: 'app-destroy', standalone: true, template: '' })
  class DestroyComponent {}

  return [
    provideRouter([
      { path: '', component: TestComponent },
      { path: 'destroy', component: DestroyComponent },
    ]),
    provideLocationMocks(),
  ];
}

export function devtoolsTest(
  options: Partial<SetupOptions>,
  testFn: (testData: TestData) => void
): () => void;
export function devtoolsTest(testFn: (testData: TestData) => void): () => void;
export function devtoolsTest(
  arg1: Partial<SetupOptions> | ((testData: TestData) => void),
  arg2?: (testData: TestData) => void
): () => void {
  return async () => {
    const defaultOptions: SetupOptions = {
      inSsr: false,
      extensionsAvailable: true,
      createStore: true,
    };
    const fn = typeof arg1 === 'function' ? arg1 : arg2;
    assertNotNull(fn);

    const options = typeof arg1 === 'object' ? arg1 : {};
    const realOptions = { ...defaultOptions, ...options };

    const { sendSpy, connectSpy } = setupExtensions();

    const Store = signalStore(
      withState({ okay: true }),
      withDevtools('flight')
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: PLATFORM_ID,
          useValue: realOptions.inSsr ? 'server' : 'browser',
        },
        setupTestRouting(realOptions.createStore ? Store : undefined),
      ],
    });

    if (!realOptions.extensionsAvailable) {
      window.__REDUX_DEVTOOLS_EXTENSION__ = undefined;
    }

    const harness = await RouterTestingHarness.create('');
    fn({
      connectSpy,
      sendSpy,
      store: options.createStore ? TestBed.inject(Store) : undefined,
      runEffects: () => TestBed.flushEffects(),
    });
    await harness.navigateByUrl('destroy');
  };
}
