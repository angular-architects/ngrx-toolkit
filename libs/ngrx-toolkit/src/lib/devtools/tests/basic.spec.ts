import { devtoolsTest } from './helpers';

describe('Devtools Basics', () => {
  it(
    'should dispatch todo state',
    devtoolsTest(async ({ sendSpy, runEffects }) => {
      runEffects();
      expect(sendSpy).toHaveBeenCalledWith(
        { type: 'Store Update' },
        { flight: { entityMap: {}, ids: [] } },
      );
    }),
  );
});
