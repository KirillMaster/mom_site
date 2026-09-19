import { HomeData } from '@/lib/api';

jest.mock('@/hooks/useApi', () => ({
  getHomeData: jest.fn(),
}));
jest.mock('./HomeClientPage', () => () => null);
jest.mock('@/components/StructuredData', () => () => null);
jest.mock('@/components/LoadingSpinner', () => () => null);

import { getHomeData } from '@/hooks/useApi';

const baseHomeData: HomeData = {
  welcomeMessage: 'x'.repeat(160),
  bannerImage: '',
  biographyText: 'Биография',
  authorPhoto: '',
  artworks: [],
  contacts: { socialLinks: {} } as any,
};

describe('@S5-AS1 homepage SEO title/description default', () => {
  it('does not derive the title/description from a long welcomeMessage and uses the commercial default', async () => {
    (getHomeData as jest.Mock).mockResolvedValue({ ...baseHomeData });

    const { generateMetadata } = await import('./page');
    const metadata = await generateMetadata();

    const title = String(metadata.title);
    expect(title.length).toBeLessThanOrEqual(70);
    expect(title).toBe('Купить картину маслом — художник Анжела Моисеенко');
    expect(String(metadata.description).toLowerCase()).toContain('купить');
  });
});

describe('@S5-AS2 admin-configured homepage SEO overrides the defaults', () => {
  it('uses the admin-provided title and description verbatim', async () => {
    (getHomeData as jest.Mock).mockResolvedValue({
      ...baseHomeData,
      seoTitle: 'Анжела Моисеенко — картины маслом на заказ',
      seoDescription: 'Галерея и заказ картин маслом художника Анжелы Моисеенко',
    });

    const { generateMetadata } = await import('./page');
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Анжела Моисеенко — картины маслом на заказ');
    expect(metadata.description).toBe('Галерея и заказ картин маслом художника Анжелы Моисеенко');
  });
});

describe('@S5-AS4 an empty admin SEO title falls back to the default', () => {
  it('renders the default title instead of an empty one', async () => {
    (getHomeData as jest.Mock).mockResolvedValue({
      ...baseHomeData,
      seoTitle: '',
      seoDescription: '',
    });

    const { generateMetadata } = await import('./page');
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Купить картину маслом — художник Анжела Моисеенко');
  });
});
