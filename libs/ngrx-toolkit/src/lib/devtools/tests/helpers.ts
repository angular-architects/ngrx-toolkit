import { Action } from '../with-devtools';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

export function setupExtensions(
  isPlatformBrowser = true,
  isExtensionAvailable = true,
) {
  const sendSpy = jest.fn();
  const connection = {
    send: sendSpy,
  };
  const connectSpy = jest.fn(() => connection);

  if (isExtensionAvailable) {
    window.__REDUX_DEVTOOLS_EXTENSION__ = { connect: connectSpy };
  }

  if (isPlatformBrowser) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PLATFORM_ID,
          useValue: isPlatformBrowser ? 'browser' : 'server',
        },
      ],
    });
  }

  return { sendSpy, connectSpy };
}
