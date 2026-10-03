import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

// Read-only: only checks hrefs, never clicks external links.
const BOT = /^https:\/\/t\.me\/[A-Za-z0-9_]+(\?start=[\w-]+)?$/;

test('@US1-E2E artwork page has bot link with art_<id>', async ({ page }) => {
  await page.goto('/gallery');
  await page.locator('a[href^="/gallery/"]').first().click();
  await page.waitForURL(/\/gallery\/.+/);
  const bot = page.getByRole('link', { name: 'Спросить в Telegram' }).first();
  await expect(bot).toHaveAttribute('href', /\?start=art_\d+$/);
  await expect(bot).toHaveAttribute('target', '_blank');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('@US2-E2E contacts and footer link to the bot', async ({ page }) => {
  await page.goto('/contacts');
  await expect(page.getByRole('link', { name: /Telegram-бот/ })).toHaveAttribute('href', BOT);
  await expect(page.getByRole('link', { name: 'Бот в Telegram' })).toHaveAttribute('href', BOT);
});
