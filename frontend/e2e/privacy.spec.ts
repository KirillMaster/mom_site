import { test, expect } from '@playwright/test';

// Read-only: only navigates and reads pages; never submits the contact form.
test.use({ viewport: { width: 360, height: 740 } });

test('footer link opens the privacy policy with operator details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Политика конфиденциальности' }).click();

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Политика конфиденциальности' })).toBeVisible();
  await expect(page.getByText('Моисеенко Анжела Валерьевна').first()).toBeVisible();
});

test('contact form shows a consent link to /privacy', async ({ page }) => {
  await page.goto('/contacts');
  const link = page.getByRole('link', { name: 'политикой конфиденциальности' });

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/privacy');
});
