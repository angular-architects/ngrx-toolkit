import { signalStore } from '@ngrx/signals';
import { withDevtools } from '../with-devtools';
import { setupExtensions } from './helpers';
import { TestBed } from '@angular/core/testing';

describe('connect & send', () => {
  it('should connect', () => {
    const Store = signalStore({ providedIn: 'root' }, withDevtools('flight'));
    const { connectSpy } = setupExtensions();
    TestBed.inject(Store);
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('should not connect if Redux Devtools are not available', () => {
    const { connectSpy } = setupExtensions(true, false);
    expect(connectSpy).toHaveBeenCalledTimes(0);
  });

  it('should not connect if it runs on the server', () => {
    const { connectSpy } = setupExtensions(false);
    expect(connectSpy).toHaveBeenCalledTimes(0);
  });

  it('should only send when store is initialized', () => {
    const { sendSpy } = setupExtensions();
    expect(sendSpy).toHaveBeenCalledTimes(0);

    const Store = signalStore({ providedIn: 'root' }, withDevtools('flight'));
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledTimes(0);

    TestBed.inject(Store);
    TestBed.flushEffects();
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});
