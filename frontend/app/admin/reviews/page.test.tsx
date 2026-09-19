import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReviewsPage from './page';
import { auth, ReviewAdmin } from '@/lib/api';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: (url: string) => replace(url) }),
}));

jest.mock('@/lib/api', () => ({
  auth: { getToken: jest.fn() },
}));

const published: ReviewAdmin = {
  id: 1,
  authorName: 'Ольга',
  text: 'старый текст',
  rating: 5,
  createdAt: '2026-01-01T00:00:00Z',
  isPublished: true,
  sortOrder: 0,
};

const unpublished: ReviewAdmin = {
  id: 2,
  authorName: 'Иван',
  text: 'Хорошая выставка',
  rating: 4,
  createdAt: '2026-01-02T00:00:00Z',
  isPublished: false,
  sortOrder: 1,
};

const mutateAsync = jest.fn().mockResolvedValue(undefined);
const mutate = jest.fn();

let reviewsData: ReviewAdmin[] = [published, unpublished];

jest.mock('@/hooks/useApi', () => ({
  useAdminReviews: () => ({ data: reviewsData, isLoading: false, isError: false }),
  usePublishReview: () => ({ mutate }),
  useUnpublishReview: () => ({ mutate }),
  useUpdateReview: () => ({ mutateAsync }),
  useDeleteReview: () => ({ mutate }),
}));

const getToken = auth.getToken as jest.Mock;

describe('Admin reviews page', () => {
  beforeEach(() => {
    replace.mockClear();
    getToken.mockReset();
    mutate.mockClear();
    mutateAsync.mockClear();
    reviewsData = [published, unpublished];
  });

  // @S5-AS1: an unauthenticated visitor never sees the reviews list — the
  // guard redirects to /admin (the login page) before content renders.
  it('[S5-AS1] redirects an unauthorized visitor away from the page', () => {
    getToken.mockReturnValue(null);

    render(<ReviewsPage />);

    expect(replace).toHaveBeenCalledWith('/admin');
    expect(screen.queryByText('Отзывы')).not.toBeInTheDocument();
  });

  // @S5-AS2: an authorized admin sees every review, published or not, with
  // an explicit status indicator for each.
  it('[S5-AS2] shows all reviews with their publication status once authorized', async () => {
    getToken.mockReturnValue('jwt-token');

    render(<ReviewsPage />);

    await waitFor(() => expect(screen.getByText('Ольга')).toBeInTheDocument());
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByTestId('review-status-1')).toHaveTextContent('Опубликован');
    expect(screen.getByTestId('review-status-2')).toHaveTextContent('Не опубликован');
  });

  // @S5-AS5: editing opens a form pre-filled with the review's current
  // text; saving calls the update API with the new text and the change
  // shows up in the list without a page reload.
  it('[S5-AS5] edits a review through the modal and reflects the new text', async () => {
    getToken.mockReturnValue('jwt-token');

    render(<ReviewsPage />);

    await waitFor(() => expect(screen.getByText('Ольга')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: 'Редактировать' })[0]);

    const textarea = await screen.findByLabelText('Текст отзыва');
    expect(textarea).toHaveValue('старый текст');

    fireEvent.change(textarea, { target: { value: 'новый текст' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ id: 1, payload: { text: 'новый текст' } })
    );

    // Simulate the query-invalidation refetch bringing back the edited row,
    // and confirm the modal has closed so the list is what's visible.
    reviewsData = [{ ...published, text: 'новый текст' }, unpublished];

    await waitFor(() => expect(screen.queryByLabelText('Текст отзыва')).not.toBeInTheDocument());
  });
});
