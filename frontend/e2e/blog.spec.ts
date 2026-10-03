import { test, expect, type Page } from '@playwright/test';

const STAMP = Date.now();

// 1x1 PNG — достаточно, чтобы пройти загрузку обложки.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.use({ viewport: { width: 360, height: 740 } });

const ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin';
const created: number[] = [];

async function login(page: Page) {
  await page.goto('/admin', { waitUntil: 'networkidle' });
  await page.locator('form input[type="text"]').fill(ADMIN_USER);
  await page.locator('form input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForFunction(() => !!localStorage.getItem('token'));
}

async function writePost(page: Page, title: string) {
  await page.goto('/admin/blog');
  await page.getByRole('link', { name: 'Написать новость' }).click();
  await expect(page).toHaveURL('/admin/blog/new');
  await page.getByLabel('Заголовок', { exact: true }).fill(title);
  await page.getByLabel('Текст новости').click();
  await page.keyboard.type(`Приглашаю всех на выставку. ${title}`);
}

function rememberId(page: Page) {
  const id = Number(new URL(page.url()).pathname.split('/').pop());
  if (id && !created.includes(id)) created.push(id);
}

async function savedSlug(page: Page) {
  await expect(page).toHaveURL(/\/admin\/blog\/\d+$/);
  rememberId(page);
  await page.getByText('Дополнительно (можно не трогать)').click();
  const slug = await page.locator('#post-slug').inputValue();
  expect(slug).not.toBe('');
  return slug;
}

test.describe('Блог', () => {
  test.beforeEach(async ({ page }) => login(page));

  test.afterEach(async ({ page, baseURL }) => {
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const api = new URL('/api/admin/blog/', baseURL).toString();
    for (const id of created.splice(0)) {
      await page.request.delete(api + id, { headers: { Authorization: `Bearer ${token}` } });
    }
  });

  test('новость с фото публикуется и видна на сайте', async ({ page }) => {
    const title = `E2E выставка ${STAMP}`;
    await writePost(page, title);

    await page.getByTestId('cover-input').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: PIXEL });
    await expect(page.getByAltText('Обложка новости')).toBeVisible();

    await page.getByText('Дополнительно (можно не трогать)').click();
    await page.getByLabel('Анонс').fill('Короткий анонс для списка новостей.');

    await page.getByRole('button', { name: 'Опубликовать', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Новость опубликована.' })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/blog\/\d+$/);
    rememberId(page);
    const slug = await page.locator('#post-slug').inputValue();

    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();

    await page.goto('/blog');
    await expect(page.getByText(title)).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('черновик на сайте не виден', async ({ page }) => {
    await writePost(page, `E2E черновик ${STAMP}`);
    await page.getByRole('button', { name: 'Сохранить черновик' }).click();
    const slug = await savedSlug(page);

    const response = await page.goto(`/blog/${slug}`);
    expect(response?.status()).toBe(404);
  });
});
