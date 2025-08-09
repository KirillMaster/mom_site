import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Анжела Моисеенко/);
});

test('get started link', async ({ page }) => {
  await page.goto('/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Смотреть галерею' }).click();

  // Expects the URL to contain gallery.
  await expect(page).toHaveURL(/.*gallery/);
});
