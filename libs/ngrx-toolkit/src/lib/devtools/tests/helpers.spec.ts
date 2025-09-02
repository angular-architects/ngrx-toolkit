import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

export type Flight = {
  id: number;
  from: string;
  to: string;
  date: Date;
  delayed: boolean;
};

export function setupExtensions(
  isPlatformBrowser = true,
  isExtensionAvailable = true,
) {
  const sendSpy = vi.fn();
  const connection = {
    send: sendSpy,
  };
  const connectSpy = vi.fn(() => connection);

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

it('should initialize', () => {
  const { connectSpy } = setupExtensions();
  expect(connectSpy).not.toHaveBeenCalled();
});
