import { test, expect } from '@playwright/test';

test.describe('@US1-E2E1 ssr cache', () => {
  test('US1-E2E1: repeated /about request is served from the Next.js cache', async ({ request }) => {
    let cache: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await request.get('/about');
      expect(res.status()).toBe(200);
      cache = res.headers()['x-nextjs-cache'];
      if (cache === 'HIT') break;
    }
    expect(cache).toBe('HIT');
  });

  test('US1-E2E1: /internal/revalidate is not reachable from outside (POST)', async ({ request }) => {
    const res = await request.post('/internal/revalidate');
    expect(res.status()).toBe(404);
  });

  test('US1-E2E1: /internal/revalidate is not reachable from outside (GET)', async ({ request }) => {
    const res = await request.get('/internal/revalidate');
    expect(res.status()).toBe(404);
  });
});
