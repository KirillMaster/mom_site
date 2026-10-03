import { test, expect, type Page } from '@playwright/test';

// Только чтение: безопасно гонять против прода.
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin';

async function login(page: Page) {
  await page.goto('/admin', { waitUntil: 'networkidle' });
  await page.locator('form input[type="text"]').fill(ADMIN_USER);
  await page.locator('form input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForFunction(() => !!localStorage.getItem('token'));
}

test.describe('Админ-панель', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('дашборд открывается после входа', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Админ-панель' })).toBeVisible();
  });

  test('список картин и форма добавления с категориями', async ({ page }) => {
    await page.locator('a[href="/admin/artworks"]').click();
    await expect(page).toHaveURL('/admin/artworks');
    await expect(page.locator('table > tbody > tr').first()).toBeVisible();
    await page.getByRole('button', { name: 'Добавить картину' }).click();
    await expect(page.getByText('Добавить новую картину')).toBeVisible();
    expect(await page.locator('select[name="categoryId"] > option').count()).toBeGreaterThan(1);
  });

  test('таблица категорий не пустая', async ({ page }) => {
    await page.locator('a[href="/admin/categories"]').click();
    await expect(page).toHaveURL('/admin/categories');
    await expect(page.locator('table > tbody > tr').first()).toBeVisible();
  });
});
