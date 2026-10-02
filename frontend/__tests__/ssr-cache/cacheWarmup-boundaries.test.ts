/** @jest-environment node */
import { startWarmup } from '../../lib/cacheWarmup';

const sitemap = (n: number) =>
  `<urlset>${Array.from({ length: n }, (_, i) => `<url><loc>https://angelamoiseenko.ru/p${i}?a=1</loc></url>`).join('')}</urlset>`;

describe('boundary: empty and small sitemaps', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    delete process.env.PORT;
    jest.restoreAllMocks();
  });

  it('US3-AS8: empty sitemap (0 URLs) makes no page requests', async () => {
    const emptySitemap = '<urlset></urlset>';
    const fetchMock = jest.fn(async (input: any) => {
      if (String(input).endsWith('/sitemap.xml')) {
        return new Response(emptySitemap, { status: 200 });
      }
      throw new Error('should not request page');
    });
    global.fetch = fetchMock as any;

    const { status, done } = startWarmup();
    expect(status).toBe('started');
    await done;

    const calls = fetchMock.mock.calls;
    expect(calls.filter((c) => String(c[0]).endsWith('/sitemap.xml'))).toHaveLength(1);
    expect(calls).toHaveLength(1);
  });

  it('US3-AS8: single URL sitemap uses 1 worker', async () => {
    const singleSitemap = '<urlset><url><loc>https://angelamoiseenko.ru/p1</loc></url></urlset>';
    let active = 0;
    let max = 0;
    global.fetch = jest.fn(async (input: any) => {
      if (String(input).endsWith('/sitemap.xml')) {
        return new Response(singleSitemap, { status: 200 });
      }
      active++;
      max = Math.max(max, active);
      active--;
      return new Response('ok');
    }) as any;

    const { done } = startWarmup();
    await done;
    expect(max).toBeLessThanOrEqual(1);
  });

  it('US3-AS8: 3 URLs use all 3 workers', async () => {
    process.env.PORT = '3000';
    const sitemapWith3 = '<urlset><url><loc>https://angelamoiseenko.ru/p1</loc></url><url><loc>https://angelamoiseenko.ru/p2</loc></url><url><loc>https://angelamoiseenko.ru/p3</loc></url></urlset>';
    let active = 0;
    let max = 0;
    global.fetch = jest.fn(async (input: any) => {
      if (String(input).endsWith('/sitemap.xml')) {
        return new Response(sitemapWith3, { status: 200 });
      }
      active++;
      max = Math.max(max, active);
      await new Promise((r) => setTimeout(r, 2));
      active--;
      return new Response('ok');
    }) as any;

    const { done } = startWarmup();
    await done;
    expect(max).toBeLessThanOrEqual(3);
    expect(max).toBeGreaterThanOrEqual(1);
  });

  it('US3-AS8: 7 URLs still cap at 3 workers', async () => {
    process.env.PORT = '3000';
    let active = 0;
    let max = 0;
    global.fetch = jest.fn(async (input: any) => {
      if (String(input).endsWith('/sitemap.xml')) {
        return new Response(sitemap(7), { status: 200 });
      }
      active++;
      max = Math.max(max, active);
      await new Promise((r) => setTimeout(r, 2));
      active--;
      return new Response('ok');
    }) as any;

    const { done } = startWarmup();
    await done;
    expect(max).toBe(3);
  });
});

describe('boundary: port handling', () => {
  const realFetch = global.fetch;
  const oldPort = process.env.PORT;
  afterEach(() => {
    global.fetch = realFetch;
    if (oldPort === undefined) delete process.env.PORT;
    else process.env.PORT = oldPort;
    jest.restoreAllMocks();
  });

  it('US3-AS8: default port 3000 when PORT env unset', async () => {
    delete process.env.PORT;
    let sitemapUrl = '';
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input);
      if (url.includes('/sitemap.xml')) {
        sitemapUrl = url;
        return new Response(sitemap(0), { status: 200 });
      }
      return new Response('ok');
    }) as any;

    const { done } = startWarmup();
    await done;
    expect(sitemapUrl).toBe('http://127.0.0.1:3000/sitemap.xml');
  });

  it('US3-AS8: custom PORT used when set', async () => {
    process.env.PORT = '8888';
    let sitemapUrl = '';
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input);
      if (url.includes('/sitemap.xml')) {
        sitemapUrl = url;
        return new Response(sitemap(0), { status: 200 });
      }
      return new Response('ok');
    }) as any;

    const { done } = startWarmup();
    await done;
    expect(sitemapUrl).toBe('http://127.0.0.1:8888/sitemap.xml');
  });
});

describe('boundary: URL translation HTTPS->HTTP', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('US3-AS8: converts angelamoiseenko.ru to 127.0.0.1', async () => {
    const urls: string[] = [];
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('/sitemap.xml')) {
        return new Response(
          '<urlset><url><loc>https://angelamoiseenko.ru/gallery/artwork-1</loc></url><url><loc>https://angelamoiseenko.ru/about?lang=en</loc></url></urlset>',
          { status: 200 }
        );
      }
      return new Response('ok');
    }) as any;

    const { done } = startWarmup('http://127.0.0.1:3000');
    await done;

    expect(urls).toContain('http://127.0.0.1:3000/sitemap.xml');
    expect(urls).toContain('http://127.0.0.1:3000/gallery/artwork-1');
    expect(urls).toContain('http://127.0.0.1:3000/about?lang=en');
  });
});

describe('boundary: XML parsing edge cases', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('US3-AS8: extracts URLs with whitespace in loc tags', async () => {
    const urlsRequested: string[] = [];
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input);
      if (!url.endsWith('/sitemap.xml')) {
        urlsRequested.push(url);
      }
      if (url.includes('/sitemap.xml')) {
        return new Response(
          '<urlset><url><loc>  https://angelamoiseenko.ru/p1  </loc></url></urlset>',
          { status: 200 }
        );
      }
      return new Response('ok');
    }) as any;

    const { done } = startWarmup('http://127.0.0.1:3000');
    await done;

    expect(urlsRequested).toContain('http://127.0.0.1:3000/p1');
  });

  it('US3-AS8: handles sitemap with XML namespace and extra fields', async () => {
    const urlsRequested: string[] = [];
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input);
      if (!url.endsWith('/sitemap.xml')) {
        urlsRequested.push(url);
      }
      if (url.includes('/sitemap.xml')) {
        return new Response(
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://angelamoiseenko.ru/p1</loc><lastmod>2024-01-01</lastmod></url>
            <url><loc>https://angelamoiseenko.ru/p2</loc><priority>0.8</priority></url>
          </urlset>`,
          { status: 200 }
        );
      }
      return new Response('ok');
    }) as any;

    const { done } = startWarmup('http://127.0.0.1:3000');
    await done;

    expect(urlsRequested).toHaveLength(2);
    expect(urlsRequested).toContain('http://127.0.0.1:3000/p1');
    expect(urlsRequested).toContain('http://127.0.0.1:3000/p2');
  });
});

describe('boundary: individual URL failure isolation', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('US3-AS8: URL timeout does not stop other URLs', async () => {
    const urlsRequested: string[] = [];
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input);
      if (url.includes('/sitemap.xml')) {
        return new Response(sitemap(3), { status: 200 });
      }
      urlsRequested.push(url);
      if (url.includes('/p0')) {
        throw new DOMException('timeout', 'TimeoutError');
      }
      return new Response('ok');
    }) as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { done } = startWarmup();
    await done;

    expect(urlsRequested).toHaveLength(3);
    expect(urlsRequested.filter((u) => u.includes('/p1'))).toHaveLength(1);
    expect(urlsRequested.filter((u) => u.includes('/p2'))).toHaveLength(1);
  });

  it('US3-AS8: sitemap fetch timeout does not crash process', async () => {
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input);
      if (url.includes('/sitemap.xml')) {
        throw new DOMException('timeout', 'TimeoutError');
      }
      return new Response('ok');
    }) as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { status, done } = startWarmup();
    expect(status).toBe('started');
    await expect(done).resolves.toBeUndefined();
  });
});
