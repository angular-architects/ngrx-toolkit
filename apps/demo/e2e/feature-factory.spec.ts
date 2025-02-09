import { test, expect } from '@playwright/test';

test.describe('feature factory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await page.getByRole('link', { name: 'withFeatureFactory' }).click();
  });

  test(`loads user`, async ({ page }) => {
    await expect(page.getByText('Current User: -')).toBeVisible();
    await page.getByRole('button', { name: 'Load User' }).click();
    await expect(page.getByText('Current User: Konrad')).toBeVisible();
  });
});
