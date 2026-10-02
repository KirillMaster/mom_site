import { render } from '@testing-library/react';
import ArtworkPage from '@/app/gallery/[slug]/page';
import { getGalleryData } from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({
  getGalleryData: jest.fn(),
  getImageUrl: (p: string) => (p.startsWith('http') ? p : `https://cdn.test${p}`),
}));
jest.mock('next/navigation', () => ({ notFound: jest.fn() }));
jest.mock('@/lib/analytics', () => ({ reachGoal: jest.fn(), Goals: { ArtworkView: 'a', ContactClick: 'c' } }));
jest.mock('yet-another-react-lightbox', () => ({ __esModule: true, default: () => null }));
jest.mock('yet-another-react-lightbox/plugins/zoom', () => ({ __esModule: true, default: {} }));
jest.mock('yet-another-react-lightbox/styles.css', () => ({}), { virtual: true });

describe('@US3-AS10 JSON-LD image array', () => {
  it('lists all photo URLs in order, cover first, and renders 3 numbered imgs', async () => {
    (getGalleryData as jest.Mock).mockResolvedValue({
      categories: [],
      artworks: [
        {
          id: 5,
          title: 'Сирень',
          isForSale: false,
          imagePath: '/a.jpg',
          thumbnailPath: '/ta.jpg',
          images: [
            { id: 2, imagePath: '/b.jpg', thumbnailPath: '/tb.jpg', sortOrder: 1 },
            { id: 1, imagePath: '/a.jpg', thumbnailPath: '/ta.jpg', sortOrder: 0 },
            { id: 3, imagePath: '/c.jpg', thumbnailPath: '/tc.jpg', sortOrder: 2 },
          ],
        },
      ],
    });
    const { container } = render(await ArtworkPage({ params: { slug: 'siren-5' } }));
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld.image).toEqual(['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg', 'https://cdn.test/c.jpg']);
    expect(container.querySelectorAll('img[alt^="Сирень — фото"]')).toHaveLength(3);
  });
});
