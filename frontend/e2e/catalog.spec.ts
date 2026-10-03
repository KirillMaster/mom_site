import { test, expect, type APIRequestContext } from '@playwright/test';

// Read-only: only GET requests against the public site, nothing is written.
// Data is discovered from /api/public/gallery, so the spec works on any env
// (local, prod) and skips scenarios for which there is no suitable work.

interface PublicArtwork {
  id: number;
  title: string;
  status?: string;
  price?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
}

const slugOf = (a: PublicArtwork) => `x-${a.id}`;

async function loadArtworks(request: APIRequestContext): Promise<PublicArtwork[]> {
  const res = await request.get('/api/public/gallery');
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.artworks?.$values ?? body.artworks ?? [];
}

async function jsonLd(page: import('@playwright/test').Page) {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((t) => JSON.parse(t)).find((j) => j['@type'] === 'VisualArtwork');
}

test.describe('@US-catalog публичный каталог', () => {
  test('Available: карточка с размером, ценой и VisualArtwork + Offer', async ({ page, request }) => {
    const art = (await loadArtworks(request)).find((a) => a.status === 'Available' && a.price && a.widthCm);
    test.skip(!art, 'нет доступной работы с ценой и размером');
    await page.goto(`/gallery/${slugOf(art!)}`);
    await expect(page.getByText(`${art!.widthCm}`).first()).toBeVisible();
    const ld = await jsonLd(page);
    expect(ld.width.value).toBe(art!.widthCm);
    expect(ld.offers.priceCurrency).toBe('RUB');
  });

  test('Sold: бейдж статуса, в JSON-LD нет цены в наличии', async ({ page, request }) => {
    const art = (await loadArtworks(request)).find((a) => a.status === 'Sold');
    test.skip(!art, 'нет проданной работы');
    await page.goto(`/gallery/${slugOf(art!)}`);
    await expect(page.getByText('Продана').first()).toBeVisible();
    const ld = await jsonLd(page);
    expect(ld.offers?.availability ?? '').not.toMatch(/InStock/);
  });

  test('скрытая работа: прямой URL даёт 404', async ({ request }) => {
    const ids = new Set((await loadArtworks(request)).map((a) => a.id));
    let hidden = 1;
    while (ids.has(hidden) && hidden < 10000) hidden++;
    const res = await request.get(`/gallery/x-${hidden}`);
    expect(res.status()).toBe(404);
  });
});
