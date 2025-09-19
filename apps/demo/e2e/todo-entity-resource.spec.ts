import { expect, test } from '@playwright/test';

test.describe('withEntityResources - todos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await page.getByRole('link', { name: 'withEntityResources' }).click();
  });

  test('add one todo and remove another', async ({ page }) => {
    await expect(page.getByRole('row', { name: 'Buy milk' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'Walk the dog' })).toBeVisible();

    await page.locator('[data-id="todoer-new"]').click();
    await page.locator('[data-id="todoer-new"]').fill('Read a book');
    await page.locator('[data-id="todoer-add"]').click();

    await expect(page.getByRole('row', { name: 'Read a book' })).toBeVisible();

    await page
      .getByRole('row', { name: 'Buy milk' })
      .locator('[data-id="todoer-delete"]')
      .click();

    await expect(page.getByRole('row', { name: 'Buy milk' })).toHaveCount(0);
    await expect(page.getByRole('row', { name: 'Read a book' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'Walk the dog' })).toBeVisible();
  });
});
