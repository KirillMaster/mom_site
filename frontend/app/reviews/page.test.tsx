import { render } from '@testing-library/react';
import ReviewsPage, { generateMetadata } from './page';
import { getReviewsData, getGalleryData } from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({
  getReviewsData: jest.fn(),
  getGalleryData: jest.fn(),
  submitReview: jest.fn(),
  getImageUrl: (path: string) => path,
}));

jest.mock('@/components/Navigation', () => () => <div data-testid="navigation" />);
jest.mock('@/components/Footer', () => () => <div data-testid="footer" />);

const mockedGetReviewsData = getReviewsData as jest.Mock;
const mockedGetGalleryData = getGalleryData as jest.Mock;

const review = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  authorName: 'Ольга',
  authorCity: 'Москва',
  text: 'Очень понравилось',
  rating: 4,
  createdAt: '2026-01-15T12:00:00Z',
  sortOrder: 0,
  artworkId: null,
  photoPath: null,
  ...overrides,
});

describe('@S4-AS10 /reviews имеет уникальные SEO-метаданные', () => {
  it('отдаёт уникальные title/description и canonical', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toContain('Отзывы');
    expect(String(metadata.description)).toContain('отзывы');
    expect(metadata.alternates?.canonical).toBe('https://angelamoiseenko.ru/reviews');
  });
});

describe('@S4-AS12 AggregateRating выводится при наличии опубликованных отзывов', () => {
  it('добавляет JSON-LD AggregateRating и Review для каждого отзыва', async () => {
    mockedGetReviewsData.mockResolvedValue([review()]);
    mockedGetGalleryData.mockResolvedValue({ artworks: [], categories: [] });

    const element = await ReviewsPage();
    const { container } = render(element);

    const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]'));
    const payloads = scripts.map((script) => JSON.parse(script.innerHTML));

    const aggregate = payloads.find((payload) => payload['@type'] === 'AggregateRating');
    expect(aggregate).toBeDefined();
    expect(aggregate.ratingValue).toBe('4.0');
    expect(aggregate.reviewCount).toBe(1);

    const reviewSchema = payloads.find((payload) => payload['@type'] === 'Review');
    expect(reviewSchema).toBeDefined();
    expect(reviewSchema.author).toEqual({ '@type': 'Person', name: 'Ольга' });
    expect(reviewSchema.reviewRating.ratingValue).toBe(4);
    expect(reviewSchema.reviewBody).toBe('Очень понравилось');
    expect(reviewSchema.datePublished).toBe('2026-01-15T12:00:00Z');
  });
});

describe('@S4-AS13 AggregateRating не выводится при нуле опубликованных отзывов', () => {
  it('не рендерит JSON-LD AggregateRating', async () => {
    mockedGetReviewsData.mockResolvedValue([]);
    mockedGetGalleryData.mockResolvedValue({ artworks: [], categories: [] });

    const element = await ReviewsPage();
    const { container } = render(element);

    const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]'));
    const payloads = scripts.map((script) => JSON.parse(script.innerHTML));

    expect(payloads.find((payload) => payload['@type'] === 'AggregateRating')).toBeUndefined();
  });
});
