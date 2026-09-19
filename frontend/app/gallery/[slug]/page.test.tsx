import { render, screen } from '@testing-library/react';
import ArtworkPage from './page';
import { getGalleryData } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';

jest.mock('@/hooks/useApi', () => ({
  getGalleryData: jest.fn(),
  getImageUrl: (path: string) => path,
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const mockedGetGalleryData = getGalleryData as jest.Mock;

const gallery = (artworks: any[]) => ({ artworks, categories: [] });

describe('@S1-AS1 visiting an artwork slug URL renders that artwork', () => {
  it('renders the artwork matched by the slug', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 7, title: 'Осенний сад', isForSale: false }])
    );

    const element = await ArtworkPage({ params: { slug: 'osenniy-sad-7' } });
    render(element);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Осенний сад');
  });
});

describe('@S1-AS4 an unresolvable slug returns 404', () => {
  it('calls notFound when no artwork matches the slug at all', async () => {
    mockedGetGalleryData.mockResolvedValue(gallery([]));

    await expect(
      ArtworkPage({ params: { slug: 'this-slug-does-not-exist-1' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('@S1-AS5 a slug with a non-matching trailing id returns 404', () => {
  it('calls notFound when the trailing id has no artwork', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 7, title: 'Осенний сад', isForSale: false }])
    );

    await expect(
      ArtworkPage({ params: { slug: 'osenniy-sad-42' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('@S1-AS6 a stale title segment still resolves by id', () => {
  it('renders the artwork identified by the trailing id, ignoring the title words', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 7, title: 'Осенний сад', isForSale: false }])
    );

    const element = await ArtworkPage({ params: { slug: 'wrong-title-text-7' } });
    render(element);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Осенний сад');
  });
});

describe('@S1-AS7 the generated slug for a cyrillic/punctuation title resolves', () => {
  it('renders the artwork when requested via its generated slug', async () => {
    const title = '«Мама, я тебя люблю!» (этюд)';
    mockedGetGalleryData.mockResolvedValue(gallery([{ id: 12, title, isForSale: false }]));

    const slug = buildArtworkSlug(title, 12);
    const element = await ArtworkPage({ params: { slug } });
    render(element);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
  });
});

describe('@S1-AS8 two artworks sharing a title resolve to distinct pages', () => {
  it('renders each artwork via its own generated slug', async () => {
    const artworks = [
      { id: 3, title: 'Натюрморт', isForSale: false },
      { id: 88, title: 'Натюрморт', isForSale: false },
    ];
    mockedGetGalleryData.mockResolvedValue(gallery(artworks));

    const slugA = buildArtworkSlug('Натюрморт', 3);
    const elementA = await ArtworkPage({ params: { slug: slugA } });
    const { unmount } = render(elementA);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Натюрморт');
    unmount();

    const slugB = buildArtworkSlug('Натюрморт', 88);
    const elementB = await ArtworkPage({ params: { slug: slugB } });
    render(elementB);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Натюрморт');
  });
});

describe('@S1-AS9 an exhibition photo still resolves its own page without a price CTA', () => {
  it('renders the artwork and hides the "Узнать цену" button', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([
        {
          id: 55,
          title: 'С открытия выставки',
          isForSale: false,
          category: { id: 4, name: 'Фото с выставок' },
        },
      ])
    );

    const slug = buildArtworkSlug('С открытия выставки', 55);
    const element = await ArtworkPage({ params: { slug } });
    render(element);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('С открытия выставки');
    expect(screen.queryByText('Узнать цену')).not.toBeInTheDocument();
  });
});
