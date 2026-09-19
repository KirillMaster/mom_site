import { render, screen, fireEvent, within } from '@testing-library/react';
import ArtworkPage, { generateMetadata } from './page';
import { getGalleryData } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import { reachGoal, Goals } from '@/lib/analytics';

jest.mock('@/hooks/useApi', () => ({
  getGalleryData: jest.fn(),
  getImageUrl: (path: string) => path,
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ContactClick: 'contact_click' },
}));

const mockedGetGalleryData = getGalleryData as jest.Mock;

const gallery = (artworks: any[], categories: any[] = []) => ({ artworks, categories });

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

describe('@S2-AS2 a for-sale artwork with a price shows the price and a CTA', () => {
  it('displays the formatted price and the "Узнать цену" button', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 7, title: 'Осенний сад', isForSale: true, price: 45000 }])
    );

    const element = await ArtworkPage({ params: { slug: 'osenniy-sad-7' } });
    render(element);

    expect(screen.getByText(/45\s000\s?₽/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Узнать цену' })).toBeInTheDocument();
  });
});

describe('@S2-AS3 a for-sale artwork without a price shows "price on request"', () => {
  it('displays "цена по запросу" and still shows the CTA', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 8, title: 'Зимний вечер', isForSale: true, price: null }])
    );

    const element = await ArtworkPage({ params: { slug: 'zimniy-vecher-8' } });
    render(element);

    expect(screen.getByText('цена по запросу')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Узнать цену' })).toBeInTheDocument();
  });
});

describe('@S2-AS4 an artwork that is not for sale hides the purchase CTA', () => {
  it('does not render the "Узнать цену" button', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 9, title: 'Портрет', isForSale: false }])
    );

    const element = await ArtworkPage({ params: { slug: 'portret-9' } });
    render(element);

    expect(screen.queryByRole('link', { name: 'Узнать цену' })).not.toBeInTheDocument();
  });
});

describe('@S2-AS5 clicking "Узнать цену" navigates to contacts and fires the analytics goal', () => {
  it('links to /contacts identifying the artwork and fires contact_click with channel ask_price', async () => {
    (reachGoal as jest.Mock).mockClear();
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 7, title: 'Осенний сад', isForSale: true, price: 45000 }])
    );

    const element = await ArtworkPage({ params: { slug: 'osenniy-sad-7' } });
    render(element);

    const link = screen.getByRole('link', { name: 'Узнать цену' });
    expect(link.getAttribute('href')).toMatch(/^\/contacts\?/);
    expect(link.getAttribute('href')).toContain('7');

    fireEvent.click(link);

    expect(reachGoal).toHaveBeenCalledWith(
      Goals.ContactClick,
      expect.objectContaining({ channel: 'ask_price' })
    );
  });
});

describe('@S2-AS6 the artwork page lists other works from the same category', () => {
  it('shows the related-works section without the current artwork', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([
        {
          id: 7,
          title: 'Осенний сад',
          isForSale: true,
          categoryId: 1,
          category: { id: 1, name: 'Натюрморты' },
        },
        {
          id: 21,
          title: 'Ваза с фруктами',
          isForSale: true,
          categoryId: 1,
          category: { id: 1, name: 'Натюрморты' },
        },
      ])
    );

    const element = await ArtworkPage({ params: { slug: 'osenniy-sad-7' } });
    render(element);

    const heading = screen.getByText('Другие работы этой категории');
    const section = heading.closest('section') as HTMLElement;

    expect(within(section).getByText('Ваза с фруктами')).toBeInTheDocument();
    expect(within(section).queryByText('Осенний сад')).not.toBeInTheDocument();
  });
});

describe('@S2-AS7 an artwork alone in its category shows no related-works section', () => {
  it('does not render the related-works section', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([
        {
          id: 20,
          title: 'Уникальная работа',
          isForSale: true,
          categoryId: 5,
          category: { id: 5, name: 'Абстракция' },
        },
      ])
    );

    const element = await ArtworkPage({ params: { slug: 'unikalnaya-rabota-20' } });
    render(element);

    expect(screen.queryByText('Другие работы этой категории')).not.toBeInTheDocument();
  });
});

describe('@S2-AS8 the artwork page shows breadcrumbs from home to gallery to the artwork', () => {
  it('shows Главная, Галерея and the artwork title in order', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 7, title: 'Осенний сад', isForSale: false }])
    );

    const element = await ArtworkPage({ params: { slug: 'osenniy-sad-7' } });
    render(element);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    const texts = within(nav)
      .getAllByText(/^(Главная|Галерея|Осенний сад)$/)
      .map((el) => el.textContent);

    expect(texts).toEqual(['Главная', 'Галерея', 'Осенний сад']);
    expect(within(nav).getByText('Главная').closest('a')).toHaveAttribute('href', '/');
    expect(within(nav).getByText('Галерея').closest('a')).toHaveAttribute('href', '/gallery');
  });
});

describe('@S2-AS9 the artwork page shows the full-size image, description and category', () => {
  it('renders the full image (not thumbnail), the description and the category', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([
        {
          id: 7,
          title: 'Осенний сад',
          description: 'Осенний пейзаж маслом',
          isForSale: false,
          imagePath: '/full/osenniy-sad.jpg',
          thumbnailPath: '/thumb/osenniy-sad.jpg',
          category: { id: 2, name: 'Пейзажи' },
        },
      ])
    );

    const element = await ArtworkPage({ params: { slug: 'osenniy-sad-7' } });
    render(element);

    const image = screen.getByRole('img', { name: 'Осенний сад' });
    expect(image).toHaveAttribute('src', '/full/osenniy-sad.jpg');
    expect(screen.getByText('Осенний пейзаж маслом')).toBeInTheDocument();
    expect(screen.getByText('Пейзажи')).toBeInTheDocument();
  });
});

describe('@S3-AS1 unique commercially-oriented title and description', () => {
  it('produces a title containing the artwork title and "купить", and a matching description', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([
        {
          id: 7,
          title: 'Осенний сад',
          description: 'масло, холст',
          isForSale: true,
          price: 45000,
        },
      ])
    );

    const metadata = await generateMetadata({ params: { slug: 'osenniy-sad-7' } });

    expect(metadata.title).toContain('Осенний сад');
    expect((metadata.title as string).toLowerCase()).toContain('купить');
    expect(metadata.description).toContain('Осенний сад');
    expect(metadata.title).not.toEqual('Галерея Работ | Анжела Моисеенко');
  });
});

describe('@S3-AS2 canonical URL points to the artwork itself', () => {
  it('sets alternates.canonical to the absolute artwork URL', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 7, title: 'Осенний сад', isForSale: false }])
    );

    const metadata = await generateMetadata({ params: { slug: 'osenniy-sad-7' } });

    expect(metadata.alternates?.canonical).toBe('https://angelamoiseenko.ru/gallery/osenniy-sad-7');
  });
});

describe('@S3-AS3 Open Graph image is the artwork\'s own image', () => {
  it('uses the artwork\'s full-size image as the og:image', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([
        {
          id: 7,
          title: 'Осенний сад',
          isForSale: false,
          imagePath: 'https://s3.example.com/full/osenniy-sad.jpg',
        },
      ])
    );

    const metadata = await generateMetadata({ params: { slug: 'osenniy-sad-7' } });
    const images = metadata.openGraph?.images as any;
    const imageUrl = Array.isArray(images) ? images[0].url : images.url;

    expect(imageUrl).toBe('https://s3.example.com/full/osenniy-sad.jpg');
  });
});

describe('@S3-AS4 VisualArtwork/Product schema.org markup with an Offer', () => {
  it('emits JSON-LD with name, artMedium, creator and offers', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([
        {
          id: 7,
          title: 'Осенний сад',
          description: 'масло, холст',
          isForSale: true,
          price: 45000,
        },
      ])
    );

    const element = await ArtworkPage({ params: { slug: 'osenniy-sad-7' } });
    const { container } = render(element);

    const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]'));
    const jsonBlocks = scripts.map((script) => JSON.parse(script.innerHTML));
    const artworkBlock = jsonBlocks.find(
      (block) => block['@type'] === 'VisualArtwork' || block['@type'] === 'Product'
    );

    expect(artworkBlock).toBeDefined();
    expect(artworkBlock.name).toBe('Осенний сад');
    expect(artworkBlock.artMedium).toBe('масло, холст');
    expect(artworkBlock.creator).toEqual(expect.objectContaining({ name: 'Анжела Моисеенко' }));
    expect(artworkBlock.offers).toEqual(
      expect.objectContaining({
        price: 45000,
        priceCurrency: 'RUB',
      })
    );
    expect(artworkBlock.offers.availability).toEqual(expect.any(String));
  });
});

describe('@S3-AS5 artwork not for sale emits schema.org markup without offers', () => {
  it('omits the offers key entirely', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 9, title: 'Портрет', isForSale: false }])
    );

    const element = await ArtworkPage({ params: { slug: 'portret-9' } });
    const { container } = render(element);

    const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]'));
    const jsonBlocks = scripts.map((script) => JSON.parse(script.innerHTML));
    const artworkBlock = jsonBlocks.find(
      (block) => block['@type'] === 'VisualArtwork' || block['@type'] === 'Product'
    );

    expect(artworkBlock).toBeDefined();
    expect(artworkBlock.offers).toBeUndefined();
  });
});

describe('@S3-AS6 BreadcrumbList schema.org block', () => {
  it('emits a 3-item BreadcrumbList ending with the artwork title', async () => {
    mockedGetGalleryData.mockResolvedValue(
      gallery([{ id: 7, title: 'Осенний сад', isForSale: false }])
    );

    const element = await ArtworkPage({ params: { slug: 'osenniy-sad-7' } });
    const { container } = render(element);

    const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]'));
    const jsonBlocks = scripts.map((script) => JSON.parse(script.innerHTML));
    const breadcrumbBlock = jsonBlocks.find((block) => block['@type'] === 'BreadcrumbList');

    expect(breadcrumbBlock).toBeDefined();
    expect(breadcrumbBlock.itemListElement).toHaveLength(3);
    expect(breadcrumbBlock.itemListElement[2].name).toBe('Осенний сад');
  });
});
