import { Action } from '@ngrx/store';
import { expect, test } from '@playwright/test';

test.describe('DevTools', () => {
  test('DevTools do not throw an error when not available', async ({
    page,
  }) => {
    await page.goto('');
    const errors = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.getByRole('link', { name: 'DevTools', exact: true }).click();
    await expect(
      page.getByRole('row', { name: 'Go for a walk' }),
    ).toBeVisible();
  });

  test('DevTools are syncing state changes', async ({ page }) => {
    await page.goto('');

    await page.evaluate(() => {
      window['devtoolsSpy'] = [];

      window['__REDUX_DEVTOOLS_EXTENSION__'] = {
        connect: () => {
          return {
            send: (data: Action) => {
              window['devtoolsSpy'].push(data);
            },
          };
        },
      };
    });
    await page.getByRole('link', { name: 'DevTools', exact: true }).click();
    await page
      .getByRole('row', { name: 'Go for a walk' })
      .getByRole('checkbox')
      .click();
    await page
      .getByRole('row', { name: 'Exercise' })
      .getByRole('checkbox')
      .click();

    await expect(
      page.getByRole('region', { name: 'Go for a walk' }),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'Exercise' })).toBeVisible();

    await page
      .getByRole('row', { name: 'Go for a walk' })
      .getByRole('checkbox')
      .click();
    await page
      .getByRole('row', { name: 'Exercise' })
      .getByRole('checkbox')
      .click();

    await expect(
      page.getByRole('region', { name: 'Go for a walk' }),
    ).toBeHidden();
    await expect(page.getByRole('region', { name: 'Exercise' })).toBeHidden();

    const devtoolsActions = await page.evaluate(() => window['devtoolsSpy']);

    expect(devtoolsActions).toEqual([
      {
        type: 'add todo',
      },
      {
        type: 'select todo 1',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'select todo 4',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'select todo 1',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'select todo 4',
      },
      {
        type: 'Store Update',
      },
      {
        type: 'Store Update',
      },
    ]);
  });
});
