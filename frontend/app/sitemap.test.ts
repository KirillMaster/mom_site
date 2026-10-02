import sitemap from './sitemap';
import { getGalleryData, getVideosData } from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({
  getHomeData: jest.fn(),
  getGalleryData: jest.fn(),
  getAboutData: jest.fn(),
  getContactsData: jest.fn(),
  getVideosData: jest.fn(),
}));

const mockedGetGalleryData = getGalleryData as jest.Mock;
const mockedGetVideosData = getVideosData as jest.Mock;

const gallery = (artworks: any[], categories: any[] = []) => ({
  artworks,
  categories,
  bannerTitle: '',
  bannerDescription: '',
});

describe('@S4-AS1 the sitemap lists artwork pages by slug, not by query string', () => {
  it('emits slug urls for for-sale artworks and no ?artwork= urls', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([
        { id: 7, title: 'Осенний сад', isForSale: true },
        { id: 8, title: 'Зимний вечер', isForSale: true },
      ])
    );
    mockedGetVideosData.mockResolvedValue({ videos: [] });

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith('/gallery/osenniy-sad-7'))).toBe(true);
    expect(urls.some((url) => url.includes('?artwork='))).toBe(false);
  });
});

describe('@S4-AS2 the sitemap excludes exhibition photos from artwork entries', () => {
  it('does not include an entry for an exhibition-photo artwork slug', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery(
        [{ id: 55, title: 'С открытия выставки', isForSale: false, category: { id: 1, name: 'Фото с выставок' } }],
        [{ id: 1, name: 'Фото с выставок' }]
      )
    );
    mockedGetVideosData.mockResolvedValue({ videos: [] });

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith('-55'))).toBe(false);
  });
});

describe('@S4-AS11 /reviews присутствует в sitemap.ts', () => {
  it('включает https://angelamoiseenko.ru/reviews в список урлов', async () => {
    mockedGetGalleryData.mockResolvedValue(gallery([]));
    mockedGetVideosData.mockResolvedValue({ videos: [] });

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain('https://angelamoiseenko.ru/reviews');
  });
});

describe('@S4-AS3 sitemap generation degrades gracefully when the gallery API is unavailable', () => {
  it('still returns the static pages without throwing when getGalleryData rejects', async () => {
    mockedGetGalleryData.mockRejectedValue(new Error('gallery API down'));
    mockedGetVideosData.mockResolvedValue({ videos: [] });

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain('https://angelamoiseenko.ru');
    expect(urls).toContain('https://angelamoiseenko.ru/gallery');
  });
});

describe('blog in sitemap', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  const respond = (routes: Record<string, unknown>) => {
    global.fetch = jest.fn(async (input: string) => {
      const url = new URL(input, 'http://api');
      const key = url.pathname.replace(/^.*\/public\/blog/, '') || '/';
      if (!(key in routes)) return { ok: false, status: 500, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => routes[key] };
    }) as unknown as typeof fetch;
  };

  it('lists /blog, published posts with UpdatedAt and only non-empty categories', async () => {
    mockedGetGalleryData.mockResolvedValue(gallery([]));
    mockedGetVideosData.mockResolvedValue({ videos: [] });
    respond({
      '/': {
        items: [{ slug: 'vystavka', publishedAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-05T10:00:00Z' }],
        total: 1,
        page: 1,
        pageSize: 12,
      },
      '/categories': [
        { slug: 'novosti', name: 'Новости', postCount: 1 },
        { slug: 'pusto', name: 'Пусто', postCount: 0 },
      ],
    });

    const result = await sitemap();
    const post = result.find((entry) => entry.url === 'https://angelamoiseenko.ru/blog/vystavka');

    expect(result.map((e) => e.url)).toContain('https://angelamoiseenko.ru/blog');
    expect(post?.lastModified).toEqual(new Date('2026-09-05T10:00:00Z'));
    expect(result.map((e) => e.url)).toContain('https://angelamoiseenko.ru/blog/category/novosti');
    expect(result.map((e) => e.url)).not.toContain('https://angelamoiseenko.ru/blog/category/pusto');
  });

  it('keeps the rest of the sitemap when the blog API fails', async () => {
    mockedGetGalleryData.mockResolvedValue(gallery([{ id: 7, title: 'Осенний сад', isForSale: true }]));
    mockedGetVideosData.mockResolvedValue({ videos: [] });
    respond({});

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain('https://angelamoiseenko.ru/blog');
    expect(urls.some((url) => url.endsWith('/gallery/osenniy-sad-7'))).toBe(true);
  });
});
