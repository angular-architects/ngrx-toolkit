import { expect, test } from '@playwright/test';

test.describe('immutable state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await page.getByRole('link', { name: 'withImmutableState' }).click();
  });

  for (const position of ['inside', 'outside']) {
    test(`mutation ${position}`, async ({ page }) => {
      const errorInConsole = page.waitForEvent('console');
      await page.getByRole('button', { name: position }).click();
      expect((await errorInConsole).text()).toContain(
        `Cannot assign to read only property 'id'`,
      );
    });
  }

  test(`mutation via form field`, async ({ page }) => {
    const errorInConsole = page.waitForEvent('console');
    await page.getByRole('textbox').focus();
    await page.keyboard.press('Space');
    expect((await errorInConsole).text()).toContain(
      `Cannot assign to read only property 'name'`,
    );
  });
});
