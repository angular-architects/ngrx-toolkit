import {
  provideDevtoolsConfig,
  REDUX_DEVTOOLS_CONFIG,
  ReduxDevtoolsConfig,
} from '../provide-devtools-config';

describe('provideDevtoolsConfig', () => {
  it('should provide the config', () => {
    const config: ReduxDevtoolsConfig = {
      name: 'test',
      maxAge: 10,
      trace: true,
    };

    const provider = provideDevtoolsConfig(config);

    expect(provider).toEqual({
      provide: REDUX_DEVTOOLS_CONFIG,
      useValue: config,
    });
  });
});
