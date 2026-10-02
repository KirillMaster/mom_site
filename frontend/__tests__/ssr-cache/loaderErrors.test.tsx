/** @jest-environment node */
const notFoundMock = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => notFoundMock() }));
jest.mock('@/hooks/useApi', () => ({
  getHomeData: jest.fn(),
  getAboutData: jest.fn(),
  getContactsData: jest.fn(),
  getGalleryData: jest.fn(),
  getVideosData: jest.fn(),
  getReviewsData: jest.fn(),
  getImageUrl: jest.fn((p: string) => p),
}));
jest.mock('@/lib/artworkPhotos', () => ({ getArtworkPhotos: jest.fn() }));
jest.mock('../../app/HomeClientPage', () => () => null);
jest.mock('../../app/about/AboutClientPage', () => () => null);
jest.mock('../../app/contacts/ContactsClientPage', () => () => null);
jest.mock('../../app/gallery/GalleryClientPage', () => () => null);
jest.mock('../../app/videos/VideosClientPage', () => () => null);
jest.mock('@/components/StructuredData', () => () => null);
jest.mock('@/components/LoadingSpinner', () => () => null);
jest.mock('../../app/gallery/[slug]/AskPriceButton', () => () => null);
jest.mock('../../app/gallery/[slug]/ArtworkGallery', () => () => null);
jest.mock('../../app/gallery/[slug]/RelatedWorks', () => () => null);

import * as api from '@/hooks/useApi';

const apiMock = api as unknown as Record<string, jest.Mock>;
const boom = new Error('API down');

beforeEach(() => {
  jest.clearAllMocks();
  ['getHomeData', 'getAboutData', 'getContactsData', 'getGalleryData', 'getVideosData', 'getReviewsData'].forEach((n) =>
    apiMock[n].mockRejectedValue(boom)
  );
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('@US4-AS9 API error is thrown, not rendered into the cache', () => {
  const cases: Array<[string, () => Promise<any>]> = [
    ['home', async () => (await import('../../app/page')).default()],
    ['about', async () => (await import('../../app/about/page')).default()],
    ['contacts', async () => (await import('../../app/contacts/page')).default()],
    ['gallery', async () => (await import('../../app/gallery/page')).default()],
    ['videos', async () => (await import('../../app/videos/page')).default()],
    ['reviews', async () => (await import('../../app/reviews/page')).default()],
    ['artwork', async () => (await import('../../app/gallery/[slug]/page')).default({ params: { slug: 'x-1' } })],
  ];

  it.each(cases)('US4-AS9: %s page rejects when loader fails', async (_name, render) => {
    await expect(render()).rejects.toBe(boom);
  });

  it('US4-AS9: reviews page rejects when gallery loader fails', async () => {
    apiMock.getReviewsData.mockResolvedValue([]);
    const page = (await import('../../app/reviews/page')).default;
    await expect(page()).rejects.toBe(boom);
  });

  it('US4-AS9: artwork generateMetadata swallows loader errors', async () => {
    const { generateMetadata } = await import('../../app/gallery/[slug]/page');
    await expect(generateMetadata({ params: { slug: 'x-1' } })).resolves.toEqual({});
  });
});

describe('@US1-EC2 unknown artwork slug', () => {
  it('US1-EC2: slug not in gallery calls notFound', async () => {
    apiMock.getGalleryData.mockResolvedValue({ artworks: [], categories: [] });
    const page = (await import('../../app/gallery/[slug]/page')).default;
    await expect(page({ params: { slug: 'net-1' } })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('US1-EC2: API 404 calls notFound instead of a regeneration error', async () => {
    apiMock.getGalleryData.mockRejectedValue({ response: { status: 404 } });
    const page = (await import('../../app/gallery/[slug]/page')).default;
    await expect(page({ params: { slug: 'net-1' } })).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
