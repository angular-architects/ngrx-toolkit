import { test, expect } from '@playwright/test';
import { Action } from '@ngrx/store';

test('has title', async ({ page }) => {
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
  await page.getByRole('link', { name: 'DevTools' }).click();
  await page
    .getByRole('row', { name: 'Go for a walk' })
    .getByRole('checkbox')
    .click();
  await page
    .getByRole('row', { name: 'Exercise' })
    .getByRole('checkbox')
    .click();

  await expect(
    page.getByRole('region', { name: 'Go for a walk' })
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
    page.getByRole('region', { name: 'Go for a walk' })
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
