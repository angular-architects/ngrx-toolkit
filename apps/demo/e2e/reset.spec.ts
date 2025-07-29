import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('');
  await page.getByRole('link', { name: 'reset' }).click();
  await page
    .getByRole('row', { name: 'Go for a walk' })
    .getByRole('checkbox')
    .click();
  await page
    .getByRole('row', { name: 'Exercise' })
    .getByRole('checkbox')
    .click();

  await expect(
    page.getByRole('row', { name: 'Go for a walk' }).getByRole('checkbox')
  ).toBeChecked();
  await expect(
    page.getByRole('row', { name: 'Exercise' }).getByRole('checkbox')
  ).toBeChecked();

  await page.getByRole('button', { name: 'Reset State' }).click();

  await expect(
    page.getByRole('row', { name: 'Go for a walk' }).getByRole('checkbox')
  ).not.toBeChecked();
  await expect(
    page.getByRole('row', { name: 'Exercise' }).getByRole('checkbox')
  ).not.toBeChecked();
});
