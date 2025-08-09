import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/admin');
  });

  test('should display categories in the artworks modal', async ({ page }) => {
    await page.getByRole('link', { name: 'Управление картинами' }).click();
    await expect(page).toHaveURL('/admin/artworks');
    await page.getByRole('button', { name: 'Добавить картину' }).click();
    await expect(page.locator('select[name="categoryId"] > option')).toHaveCount(4);
  });

  test('should display categories in the categories table', async ({ page }) => {
    await page.getByRole('link', { name: 'Управление категориями' }).click();
    await expect(page).toHaveURL('/admin/categories');
    await expect(page.locator('table > tbody > tr')).not.toHaveCount(0);
  });
});
