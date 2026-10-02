import { render, screen } from '@testing-library/react';
import AdminPage from './page';
import { ReviewAdmin } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  auth: { getToken: () => 'token', removeToken: jest.fn() },
}));

const review = (id: number, isPublished: boolean): ReviewAdmin => ({
  id,
  authorName: 'Автор',
  text: 'Текст',
  rating: 5,
  createdAt: '2026-01-01T00:00:00Z',
  isPublished,
  sortOrder: id,
});

let reviewsData: ReviewAdmin[] | undefined;

jest.mock('@/hooks/useApi', () => ({
  useLogin: () => ({ mutate: jest.fn(), isPending: false, isError: false, error: null }),
  useArtworks: () => ({ data: [], isLoading: false }),
  useCategories: () => ({ data: [], isLoading: false }),
  useVideos: () => ({ data: [], isLoading: false }),
  useUnreadMessagesCount: () => ({ data: 0 }),
  useAdminReviews: () => ({ data: reviewsData }),
}));

describe('AdminPage — плитка «Отзывы»', () => {
  it('ведёт на страницу модерации отзывов', async () => {
    reviewsData = [];
    render(<AdminPage />);
    const heading = await screen.findByRole('heading', { name: /Отзывы/ });
    const card = heading.closest('.card') as HTMLElement;
    const link = card.querySelector('a');
    expect(link).toHaveAttribute('href', '/admin/reviews');
  });

  it('показывает счётчик неопубликованных отзывов', async () => {
    reviewsData = [review(1, true), review(2, false), review(3, false)];
    render(<AdminPage />);
    expect(await screen.findByTestId('pending-reviews-count')).toHaveTextContent('2');
  });

  it('скрывает счётчик, когда все отзывы опубликованы', async () => {
    reviewsData = [review(1, true)];
    render(<AdminPage />);
    await screen.findByRole('heading', { name: /Отзывы/ });
    expect(screen.queryByTestId('pending-reviews-count')).toBeNull();
  });
});
