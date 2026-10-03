import { test, expect, Page } from '@playwright/test';

const PAPER = 'rgb(247, 246, 243)';
const INK = 'rgb(31, 35, 40)';
const SEA = 'rgb(47, 74, 92)';
const VIEWPORTS = [
  { name: '1280', width: 1280, height: 800 },
  { name: '390', width: 390, height: 844 },
];
const STATIC_PAGES = ['/', '/gallery', '/contacts', '/blog'];
const OVERFLOW_PAGES = ['/', '/gallery', '/about', '/videos', '/reviews', '/contacts', '/blog'];

const firstArtworkPath = async (page: Page) => {
  await page.goto('/gallery');
  const href = await page.locator('a[href^="/gallery/"]').first().getAttribute('href');
  return href ?? '/gallery';
};

const style = (page: Page, selector: string, prop: string) =>
  page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

const collectConsoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
};

for (const vp of VIEWPORTS) {
  test.describe(`design system at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`@US1-AS1 paper background and ink text at ${vp.name}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      const paths = [...STATIC_PAGES, await firstArtworkPath(page)];
      for (const path of paths) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        expect(await style(page, 'body', 'background-color'), path).toBe(PAPER);
        expect(await style(page, 'body', 'color'), path).toBe(INK);
      }
      expect(errors).toEqual([]);
    });

    test(`@US4-AS3 no horizontal scroll at ${vp.name}`, async ({ page }) => {
      if (vp.width > 390) test.skip();
      const paths = [...OVERFLOW_PAGES, await firstArtworkPath(page)];
      for (const path of paths) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        expect(await overflow(page), path).toBeLessThanOrEqual(0);
      }
    });

    test(`screenshots at ${vp.name}`, async ({ page }) => {
      const targets: [string, string][] = [
        ['home', '/'],
        ['gallery', '/gallery'],
        ['artwork', await firstArtworkPath(page)],
        ['contacts', '/contacts'],
      ];
      for (const [name, path] of targets) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `test-results/design/${name}-${vp.name}.png`, fullPage: true });
      }
    });
  });
}

test.describe('typography and focus', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('@US2-E2E1 headings use Cormorant, paragraphs use Manrope', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await style(page, 'h1', 'font-family')).toContain('Cormorant');
    expect(await style(page, 'p', 'font-family')).toContain('Manrope');
  });

  test('@US2-E2E2 biography paragraph is at most 75ch wide', async ({ page }) => {
    await page.goto('/about');
    await page.evaluate(() => document.fonts.ready);
    const paragraph = page.locator('.prose-measure p').first();
    const { width, ch } = await paragraph.evaluate((el) => {
      const cs = getComputedStyle(el);
      const probe = document.createElement('span');
      probe.textContent = '0';
      probe.style.font = cs.font;
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      document.body.appendChild(probe);
      const zero = probe.getBoundingClientRect().width;
      probe.remove();
      return { width: el.getBoundingClientRect().width, ch: zero };
    });
    expect(width).toBeLessThanOrEqual(75 * ch + 1);
  });

  test('@US1-AS2 keyboard focus shows the sea ring', async ({ page }) => {
    await page.goto('/');
    for (const tag of ['A', 'BUTTON']) {
      let found = false;
      for (let i = 0; i < 40 && !found; i++) {
        await page.keyboard.press('Tab');
        found = await page.evaluate((t) => document.activeElement?.tagName === t, tag);
      }
      expect(found, tag).toBe(true);
      const ring = await page.evaluate(() => {
        const cs = getComputedStyle(document.activeElement as Element);
        return `${cs.outlineColor} ${cs.boxShadow}`;
      });
      expect(ring, tag).toContain(SEA);
    }
  });

  test('@US4-AS2 primary action is sea with light text', async ({ page }) => {
    const paths = ['/', await firstArtworkPath(page), '/contacts'];
    for (const path of paths) {
      await page.goto(path);
      const primary = page.locator('a[class*="bg-sea"], button[class*="bg-sea"]').first();
      expect(await primary.evaluate((el) => getComputedStyle(el).backgroundColor), path).toBe(SEA);
      const color = await primary.evaluate((el) => getComputedStyle(el).color);
      const [r, g, b] = color.match(/\d+/g)!.map(Number);
      expect((r + g + b) / 3, path).toBeGreaterThan(200);
    }
  });
});
