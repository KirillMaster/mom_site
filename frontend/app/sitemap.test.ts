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
