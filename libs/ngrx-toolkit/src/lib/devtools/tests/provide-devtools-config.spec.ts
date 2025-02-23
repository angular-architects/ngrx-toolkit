import { TestBed } from '@angular/core/testing';
import { provideDevtoolsConfig } from '../provide-devtools-config';
import { DevtoolsSyncer } from '../internal/devtools-syncer.service';
import { setupExtensions } from './helpers.spec';

describe('provideDevtoolsConfig', () => {
  it('DevtoolsSyncer should use the default configuration if none is provided', () => {
    const { connectSpy } = setupExtensions();
    TestBed.inject(DevtoolsSyncer);
    expect(connectSpy).toHaveBeenCalledWith({
      name: 'NgRx SignalStore',
    });
  });

  it('DevtoolsSyncer should use the configuration provided', () => {
    const { connectSpy } = setupExtensions();
    TestBed.configureTestingModule({
      providers: [provideDevtoolsConfig({ name: 'test', maxAge: 10 })],
    });
    TestBed.inject(DevtoolsSyncer);
    expect(connectSpy).toHaveBeenCalledWith({
      name: 'test',
      maxAge: 10,
    });
  });
});
