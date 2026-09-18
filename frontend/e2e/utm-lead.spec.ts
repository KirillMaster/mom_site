import { test, expect } from '@playwright/test';

const STAMP = `pw-${Date.now()}`;

test('lead submitted after a utm landing carries the campaign', async ({ page }) => {
  // The form reports its outcome with window.alert.
  page.on('dialog', (d) => d.accept());

  await page.goto(`/contacts?utm_source=playwright&utm_medium=e2e&utm_campaign=${STAMP}`);

  // The capture runs in an effect after hydration, so the cookie appears
  // slightly after the load event.
  await expect
    .poll(async () => (await page.context().cookies()).find((c) => c.name === 'utm_ft')?.value)
    .toContain(encodeURIComponent(STAMP));

  await page.fill('#name', 'E2E Playwright');
  await page.fill('#email', 'kirill.su@tenengroup.com');
  await page.fill('#subject', 'E2E UTM attribution');
  await page.fill('#message', `Automated end-to-end check ${STAMP}`);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/public/contact-message')),
    page.click('button[type="submit"]'),
  ]);

  expect(response.status()).toBe(200);
  const sent = JSON.parse(response.request().postData() ?? '{}');
  expect(sent.utm_source).toBe('playwright');
  expect(sent.utm_campaign).toBe(STAMP);
});
