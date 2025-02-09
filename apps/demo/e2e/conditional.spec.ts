import { test, expect } from '@playwright/test';

test.describe('conditional', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await page.getByRole('link', { name: 'withConditional' }).click();
  });

  test(`uses real user`, async ({ page }) => {
    await page.getByRole('radio', { name: 'Real User' }).click();
    await page.getByRole('button', { name: 'Toggle User Component' }).click();

    await expect(page.getByText('Current User Konrad')).toBeVisible();
  });

  test(`uses fake user`, async ({ page }) => {
    await page.getByRole('radio', { name: 'Fake User' }).click();
    await page.getByRole('button', { name: 'Toggle User Component' }).click();

    await expect(page.getByText('Current User Tommy Fake')).toBeVisible();
  });
});
