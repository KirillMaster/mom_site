import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

// The submit is intercepted: this path must never send a real lead.
test('@US2-E2E1 gallery -> artwork -> channels -> ask price -> form without email', async ({ page }) => {
  page.on('dialog', (d) => { d.accept().catch(() => undefined); });
  let sent: Record<string, unknown> | null = null;
  await page.route('**/api/public/contact-message', async (route) => {
    sent = JSON.parse(route.request().postData() ?? '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/gallery');
  const showMore = page.getByRole('button', { name: /Показать ещё/ });
  if (await showMore.count()) {
    await showMore.click();
  }

  await page.locator('a[href^="/gallery/"]').first().click();
  await page.waitForURL(/\/gallery\/.+/);

  await expect(page.locator('dl').first()).toContainText('Статус');

  const whatsapp = page.getByRole('link', { name: 'Написать в WhatsApp' }).first();
  await expect(whatsapp).toHaveAttribute('href', /text=/);

  await page.getByRole('link', { name: 'Узнать цену' }).first().click();
  await page.waitForURL(/\/contacts/);

  await page.fill('#name', 'E2E Playwright');
  await page.fill('#phone', '+7 900 000-00-00');
  await page.fill('#message', 'Automated end-to-end check');
  await page.click('button[type="submit"]');

  await expect.poll(() => sent).not.toBeNull();
  expect(sent).toMatchObject({ name: 'E2E Playwright' });
  expect((sent as unknown as Record<string, unknown>).email ?? '').toBe('');
});
