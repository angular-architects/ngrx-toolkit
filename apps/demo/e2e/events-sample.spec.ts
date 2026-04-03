import { Action } from '@ngrx/store';
import { expect, test } from '@playwright/test';

test.describe('events-sample + devtools', () => {
  test('DevTools are syncing events and payloads', async ({ page }) => {
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

    await page.getByRole('link', { name: 'Events + DevTools Sample' }).click();

    // Filter by title
    await page.getByPlaceholder('Filter by title or author...').fill('Hobbit');

    // Add Book (Random)
    await page.getByRole('button', { name: 'Add Book' }).click();

    // Clear Selection
    await page.getByRole('button', { name: 'Clear Selection' }).click();

    const devtoolsActions = await page.evaluate(() => window['devtoolsSpy']);

    // Check if filterUpdated event was tracked with the expected payload
    const filterEvent = devtoolsActions.find(
      (a) => a.type === '[Book Store] filterUpdated',
    );
    expect(filterEvent).toBeDefined();
    expect(filterEvent).toEqual({
      type: '[Book Store] filterUpdated',
      payload: { filter: 'Hobbit' },
    });

    // Check selectionCleared event
    const clearSelectionEvent = devtoolsActions.find(
      (a) => a.type === '[Book Store] selectionCleared',
    );
    expect(clearSelectionEvent).toBeDefined();
    expect(clearSelectionEvent).toEqual({
      type: '[Book Store] selectionCleared',
    });

    // Check bookAdded event (payload will contain random book, so just check if payload has book object)
    const bookAddedEvent = devtoolsActions.find(
      (a) => a.type === '[Book Store] bookAdded',
    );
    expect(bookAddedEvent).toBeDefined();
    expect(bookAddedEvent.payload).toBeDefined();
    expect(bookAddedEvent.payload.book).toBeDefined();
    expect(bookAddedEvent.payload.book).toHaveProperty('title');
  });
});
