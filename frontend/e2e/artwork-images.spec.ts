import { test, expect } from '@playwright/test';

// Needs a running stack with an artwork that has 4 photos; set ARTWORK_MULTI_SLUG.
const slug = process.env.ARTWORK_MULTI_SLUG;

test.describe('@US2-AS6 desktop thumbnails', () => {
  test.skip(!slug, 'ARTWORK_MULTI_SLUG not set');
  test.use({ viewport: { width: 1280, height: 800 } });
  test('clicking the third thumbnail makes it current', async ({ page }) => {
    await page.goto(`/gallery/${slug}`);
    const thumbs = page.getByTestId('gallery-thumb');
    await thumbs.nth(2).click();
    await expect(thumbs.nth(2)).toHaveAttribute('aria-current', 'true');
  });
});

test.describe('@US2-AS8 mobile carousel', () => {
  test.skip(!slug, 'ARTWORK_MULTI_SLUG not set');
  test.use({ viewport: { width: 375, height: 667 } });
  test('dots follow the scroll and thumbnails are hidden', async ({ page }) => {
    await page.goto(`/gallery/${slug}`);
    await expect(page.getByTestId('gallery-thumbs')).toBeHidden();
    await page.getByTestId('gallery-track').evaluate((el) => el.scrollTo({ left: el.clientWidth }));
    await expect(page.getByTestId('gallery-dot').nth(1)).toHaveAttribute('aria-current', 'true');
  });
});
