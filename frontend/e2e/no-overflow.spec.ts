import { test, expect, Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const STATIC_PAGES = ['/', '/gallery', '/about', '/videos', '/reviews', '/contacts', '/blog'];

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('@US6-AS1 no horizontal scroll at 390 px', () => {
  for (const path of STATIC_PAGES) {
    test(`page ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test('first artwork page', async ({ page }) => {
    await page.goto('/gallery');
    const firstCard = page.locator('a[href^="/gallery/"]').first();
    await firstCard.click();
    await page.waitForURL(/\/gallery\/.+/);
    await page.waitForLoadState('networkidle');

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});
