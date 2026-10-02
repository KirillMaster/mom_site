/** @jest-environment node */
import { startWarmup } from '../../lib/cacheWarmup';

const sitemap = (n: number) =>
  `<urlset>${Array.from({ length: n }, (_, i) => `<url><loc>https://angelamoiseenko.ru/p${i}?a=1</loc></url>`).join('')}</urlset>`;

describe('@US3-AS8 warmup via sitemap', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    delete process.env.PORT;
    jest.restoreAllMocks();
  });

  it('US3-AS8: requests all sitemap URLs on 127.0.0.1:PORT, max 3 in parallel', async () => {
    process.env.PORT = '4321';
    let active = 0;
    let max = 0;
    const urls: string[] = [];
    global.fetch = jest.fn(async (input: any) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith('/sitemap.xml')) {
        return new Response(sitemap(10), { status: 200 });
      }
      active++;
      max = Math.max(max, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return new Response('ok', { status: 200 });
    }) as any;

    const { status, done } = startWarmup();
    expect(status).toBe('started');
    await done;

    expect(urls[0]).toBe('http://127.0.0.1:4321/sitemap.xml');
    const pages = urls.slice(1);
    expect(pages).toHaveLength(10);
    pages.forEach((u) => expect(u).toMatch(/^http:\/\/127\.0\.0\.1:4321\/p\d\?a=1$/));
    expect(max).toBe(3);
  });

  it('US3-AS8: failures only go to console, warmup completes', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn(async (input: any) => {
      if (String(input).endsWith('/sitemap.xml')) return new Response(sitemap(2), { status: 200 });
      throw new Error('boom');
    }) as any;
    await expect(startWarmup().done).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
  });

  it('US3-AS8: sitemap failure does not throw', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn(async () => new Response('', { status: 500 })) as any;
    await expect(startWarmup().done).resolves.toBeUndefined();
  });
});

describe('@US2-EC3 single-flight', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('US2-EC3: second call during warmup returns already-running, no second sitemap fetch', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const fetchMock = jest.fn(async (input: any) => {
      if (String(input).endsWith('/sitemap.xml')) {
        await gate;
        return new Response(sitemap(1), { status: 200 });
      }
      return new Response('ok');
    });
    global.fetch = fetchMock as any;

    const first = startWarmup();
    const second = startWarmup();
    expect(first.status).toBe('started');
    expect(second.status).toBe('already-running');
    release();
    await first.done;
    expect(fetchMock.mock.calls.filter((c) => String(c[0]).endsWith('/sitemap.xml'))).toHaveLength(1);

    const third = startWarmup();
    expect(third.status).toBe('started');
    await third.done;
  });
});
