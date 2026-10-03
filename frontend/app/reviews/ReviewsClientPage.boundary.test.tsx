import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ReviewsClientPage from './ReviewsClientPage';
import { submitReview } from '@/hooks/useApi';
import { ReviewDto } from '@/lib/api';

jest.mock('@/components/Navigation', () => () => null);
jest.mock('@/components/Footer', () => () => null);
jest.mock('@/hooks/useApi', () => ({ submitReview: jest.fn() }));

const mocked = submitReview as jest.MockedFunction<typeof submitReview>;

const review = (o: Partial<ReviewDto> = {}): ReviewDto => ({
  id: 1,
  authorName: 'Ольга',
  authorCity: 'Москва',
  text: 'Текст',
  rating: 3,
  createdAt: '2026-01-15T12:00:00Z',
  sortOrder: 0,
  artworkId: null,
  photoPath: null,
  ...o,
});

beforeEach(() => mocked.mockReset());

describe('@US1-FE5 star rating boundaries', () => {
  it.each([0, 1, 3, 5])('shows %i filled of 5 stars', (rating) => {
    render(<ReviewsClientPage reviews={[review({ rating })]} artworksById={{}} />);
    const card = screen.getByTestId('review-1');
    expect(within(card).queryAllByTestId('star-filled')).toHaveLength(rating);
    expect(within(card).queryAllByTestId('star-empty')).toHaveLength(5 - rating);
    expect(within(card).getByLabelText(`Рейтинг: ${rating} из 5`)).toBeInTheDocument();
  });

  it('filled stars use ochre, empty stars use line colour', () => {
    render(<ReviewsClientPage reviews={[review({ rating: 2 })]} artworksById={{}} />);
    screen.getAllByTestId('star-filled').forEach((s) => expect(s).toHaveClass('text-ochre'));
    screen.getAllByTestId('star-empty').forEach((s) => expect(s).toHaveClass('text-line'));
  });
});

describe('@US1-FE5 reviews list boundaries', () => {
  it('shows the empty state only without reviews', () => {
    const { unmount } = render(<ReviewsClientPage reviews={[]} artworksById={{}} />);
    expect(screen.getByTestId('reviews-empty-state')).toBeInTheDocument();
    unmount();
    render(<ReviewsClientPage reviews={[review()]} artworksById={{}} />);
    expect(screen.queryByTestId('reviews-empty-state')).not.toBeInTheDocument();
  });

  it('omits the city when absent and links the artwork when known', () => {
    render(
      <ReviewsClientPage
        reviews={[review({ authorCity: null as any, artworkId: 7 }), review({ id: 2, artworkId: 8 })]}
        artworksById={{ 7: { id: 7, title: 'Море' } }}
      />,
    );
    expect(screen.queryByText('Москва', { selector: 'p' })).toBeInTheDocument();
    const first = screen.getByTestId('review-1');
    expect(within(first).queryByText('Москва')).not.toBeInTheDocument();
    const link = within(first).getByRole('link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toContain('/gallery/');
    expect(link.getAttribute('href')).toContain('7');
    expect(within(screen.getByTestId('review-2')).queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps an unparsable date as is', () => {
    render(<ReviewsClientPage reviews={[review({ createdAt: 'не дата' })]} artworksById={{}} />);
    expect(screen.getByText('не дата')).toBeInTheDocument();
  });
});

describe('@US1-FE5 review form boundaries', () => {
  it('offers ratings 1..5 with 5 selected by default', () => {
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);
    const select = screen.getByLabelText('Оценка') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['1', '2', '3', '4', '5']);
    expect(select.value).toBe('5');
  });

  const fill = (name: string, text: string) => {
    fireEvent.change(screen.getByLabelText('Имя *'), { target: { value: name } });
    fireEvent.change(screen.getByLabelText('Текст отзыва *'), { target: { value: text } });
  };

  it('rejects whitespace-only name and text without calling the API', () => {
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);
    fill('   ', 'ok');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Пожалуйста, укажите ваше имя');
    fill('Имя', '   ');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Пожалуйста, напишите текст отзыва');
    expect(mocked).not.toHaveBeenCalled();
  });

  it('accepts exactly 2000 characters and rejects 2001', async () => {
    mocked.mockResolvedValue(undefined as any);
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);
    fill('Имя', 'a'.repeat(2001));
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));
    expect(screen.getByRole('alert')).toHaveTextContent('2000');
    expect(mocked).not.toHaveBeenCalled();

    fill('Имя', 'a'.repeat(2000));
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));
    await waitFor(() => expect(mocked).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits trimmed values, omits empty city, then resets the form', async () => {
    mocked.mockResolvedValue(undefined as any);
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);
    fill('  Имя  ', '  Текст  ');
    fireEvent.change(screen.getByLabelText('Город'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Оценка'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));
    await waitFor(() => expect(mocked).toHaveBeenCalledTimes(1));
    expect(mocked).toHaveBeenCalledWith({ authorName: 'Имя', authorCity: undefined, text: 'Текст', rating: 2 });
    await screen.findByText(/Спасибо!/);
    expect((screen.getByLabelText('Имя *') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Оценка') as HTMLSelectElement).value).toBe('5');
  });

  it('shows an error and keeps the input when the API fails', async () => {
    mocked.mockRejectedValue(new Error('x'));
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);
    fill('Имя', 'Текст');
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось отправить отзыв');
    expect(screen.queryByText(/Спасибо!/)).not.toBeInTheDocument();
    expect((screen.getByLabelText('Имя *') as HTMLInputElement).value).toBe('Имя');
  });
});
