import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ReviewsClientPage from './ReviewsClientPage';
import { submitReview } from '@/hooks/useApi';
import { ReviewDto } from '@/lib/api';

jest.mock('@/components/Navigation', () => () => <div data-testid="navigation" />);
jest.mock('@/components/Footer', () => () => <div data-testid="footer" />);
jest.mock('@/hooks/useApi', () => ({
  submitReview: jest.fn(),
}));

const mockedSubmitReview = submitReview as jest.MockedFunction<typeof submitReview>;

const review = (overrides: Partial<ReviewDto> = {}): ReviewDto => ({
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

describe('@S4-AS1 страница /reviews отдаёт h1', () => {
  it('рендерит ровно один <h1>', () => {
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('@S4-AS2 карточка отзыва показывает имя, город, звёзды, текст и дату', () => {
  it('отображает все поля отзыва, включая 4 закрашенные звезды из 5', () => {
    render(
      <ReviewsClientPage
        reviews={[review()]}
        artworksById={{}}
      />
    );

    expect(screen.getByText('Ольга')).toBeInTheDocument();
    expect(screen.getByText('Москва')).toBeInTheDocument();
    expect(screen.getByText('Очень понравилось')).toBeInTheDocument();
    expect(screen.getByText('15.01.2026')).toBeInTheDocument();

    const card = screen.getByTestId('review-1');
    expect(within(card).getAllByTestId('star-filled')).toHaveLength(4);
    expect(within(card).getAllByTestId('star-empty')).toHaveLength(1);
  });
});

describe('@S4-AS3 отзыв со ссылкой на работу показывает эту ссылку', () => {
  it('рендерит ссылку на страницу работы "Закат над рекой"', () => {
    render(
      <ReviewsClientPage
        reviews={[review({ id: 2, artworkId: 42 })]}
        artworksById={{ 42: { id: 42, title: 'Закат над рекой' } }}
      />
    );

    const link = screen.getByRole('link', { name: 'Закат над рекой' });
    expect(link).toHaveAttribute('href', '/gallery/zakat-nad-rekoy-42');
  });
});

describe('@S4-AS4 отзыв без привязки к работе рендерится без ссылки и без ошибок', () => {
  it('не рендерит ссылку на работу для отзыва без artworkId', () => {
    render(
      <ReviewsClientPage
        reviews={[review({ id: 3, artworkId: null })]}
        artworksById={{}}
      />
    );

    const card = screen.getByTestId('review-3');
    expect(within(card).queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('@S4-AS5 пустое состояние при отсутствии отзывов', () => {
  it('показывает сообщение об отсутствии отзывов и оставляет форму доступной', () => {
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);

    expect(screen.getByTestId('reviews-empty-state')).toHaveTextContent('Отзывов пока нет');
    expect(screen.getByRole('form', { name: 'Оставить отзыв' })).toBeInTheDocument();
  });
});

describe('@S4-AS6 успешная отправка отзыва через форму', () => {
  beforeEach(() => {
    mockedSubmitReview.mockReset();
  });

  it('показывает сообщение об успехе и не добавляет отзыв в список сразу', async () => {
    mockedSubmitReview.mockResolvedValueOnce({ message: 'ok' });
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Иван' } });
    fireEvent.change(screen.getByLabelText(/Текст отзыва/), { target: { value: 'Прекрасная выставка' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));

    await waitFor(() => expect(mockedSubmitReview).toHaveBeenCalledTimes(1));
    expect(mockedSubmitReview).toHaveBeenCalledWith(
      expect.objectContaining({ authorName: 'Иван', text: 'Прекрасная выставка', rating: 5 })
    );

    expect(await screen.findByText(/появится на сайте после проверки/)).toBeInTheDocument();
    // The submitted review must not appear in the rendered list until an
    // admin publishes it — the parent only re-fetches on next page load.
    expect(screen.queryByText('Прекрасная выставка')).not.toBeInTheDocument();
  });
});

describe('@S4-AS7 форма отклоняет отправку с пустым именем', () => {
  beforeEach(() => {
    mockedSubmitReview.mockReset();
  });

  it('показывает ошибку валидации и не вызывает API', () => {
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);

    fireEvent.change(screen.getByLabelText(/Текст отзыва/), { target: { value: 'Хороший текст' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));

    expect(screen.getByRole('alert')).toHaveTextContent('имя');
    expect(mockedSubmitReview).not.toHaveBeenCalled();
  });
});

describe('@S4-AS8 форма отклоняет текст отзыва длиннее лимита', () => {
  beforeEach(() => {
    mockedSubmitReview.mockReset();
  });

  it('показывает ошибку валидации для текста длиннее 2000 символов и не отправляет запрос', () => {
    render(<ReviewsClientPage reviews={[]} artworksById={{}} />);

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Иван' } });
    fireEvent.change(screen.getByLabelText(/Текст отзыва/), { target: { value: 'a'.repeat(2001) } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить отзыв' }));

    expect(screen.getByRole('alert')).toHaveTextContent('2000');
    expect(mockedSubmitReview).not.toHaveBeenCalled();
  });
});
