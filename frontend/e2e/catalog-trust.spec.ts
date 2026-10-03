import { test, expect, type Page } from '@playwright/test';

// Read-only e2e for feature 011 against a deployed site (PLAYWRIGHT_BASE_URL).
// Only GET requests; the /order form is opened but never submitted.

const open = (page: Page, path: string) => page.goto(path, { waitUntil: 'domcontentloaded' });
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('@US5-E2E1 фильтры галереи', () => {
  test('размер M и «только в наличии» попадают в адрес; список непуст либо есть сброс', async ({ page }) => {
    await open(page, '/gallery');
    const filters = page.getByTestId('gallery-filters');
    await expect(filters).toBeVisible();

    await filters.getByRole('button', { name: /^M/ }).click();
    await filters.getByRole('button', { name: 'Только в наличии' }).click();

    await expect(page).toHaveURL(/size=M/);
    await expect(page).toHaveURL(/available=1/);
    await expect(filters.getByRole('button', { name: /^M/ })).toHaveAttribute('aria-pressed', 'true');

    const cards = page.locator('a[href^="/gallery/"]');
    const empty = page.getByText('Ничего не найдено');
    await expect(cards.first().or(empty)).toBeVisible();
    if (await empty.isVisible()) {
      await expect(page.getByRole('button', { name: 'Сбросить' }).first()).toBeVisible();
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(filters.getByRole('button', { name: /^M/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(filters.getByRole('button', { name: 'Только в наличии' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('@US1-E2E1 сквозная проверка 011 на 390 px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('главная: подзаголовок, «Сейчас в наличии», доверие, изображения через оптимизатор', async ({ page }) => {
    await open(page, '/');
    await expect(page.getByText('Живопись маслом из Крыма. Работы в коллекциях 12 стран')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Сейчас в наличии' })).toBeVisible();
    await expect(page.getByText('Член Союза художников России').first()).toBeVisible();

    const srcs = await page
      .locator('main img[src], section img[src]')
      .evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src') || ''));
    const works = srcs.filter((s) => s.includes('twcstorage') || s.startsWith('/_next/image'));
    expect(works.length).toBeGreaterThan(0);
    for (const src of works) expect(src.startsWith('/_next/image'), src).toBe(true);
  });

  test('страница работы: «Как купить» и схема масштаба', async ({ page }) => {
    await open(page, '/gallery');
    const links = await page.locator('a[href^="/gallery/"]').evaluateAll((as) =>
      as.map((a) => a.getAttribute('href') || ''),
    );
    expect(links.length).toBeGreaterThan(0);
    let found = false;
    for (const href of links.slice(0, 12)) {
      await open(page, href);
      if (await page.locator('[data-testid="scale-diagram"], svg[aria-label*="масштаб" i]').count()) {
        found = true;
        break;
      }
    }
    await expect(page.getByText('Как купить').first()).toBeVisible();
    expect(found, 'среди первых работ нет страницы со схемой масштаба').toBe(true);
  });

  test('/order открывается с формой и без горизонтальной прокрутки', async ({ page }) => {
    await open(page, '/order');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test('/about: раздел «Выставки» с фотографиями', async ({ page }) => {
    await open(page, '/about');
    await expect(page.getByRole('heading', { name: 'Выставки', exact: true })).toBeVisible();
    const photos = page.getByTestId('exhibition-photos');
    await expect(photos).toBeAttached();
    expect(await photos.locator('img').count()).toBeGreaterThan(0);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
});
