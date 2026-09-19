'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ReviewDto } from '@/lib/api';
import { submitReview } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';

export interface ReviewArtwork {
  id: number;
  title: string;
}

interface ReviewsClientPageProps {
  reviews: ReviewDto[];
  artworksById: Record<number, ReviewArtwork>;
}

const TEXT_LIMIT = 2000;

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ru-RU');
};

// Five-star display: filled stars carry a distinct testid so tests can count
// them without depending on visual styling (@S4-AS2).
const Stars = ({ rating }: { rating: number }) => (
  <div aria-label={`Рейтинг: ${rating} из 5`} className="flex gap-0.5" data-testid="review-stars">
    {[1, 2, 3, 4, 5].map((position) => (
      <span
        key={position}
        data-testid={position <= rating ? 'star-filled' : 'star-empty'}
        className={position <= rating ? 'text-yellow-400' : 'text-gray-300'}
        aria-hidden="true"
      >
        ★
      </span>
    ))}
  </div>
);

const ReviewCard = ({ review, artwork }: { review: ReviewDto; artwork?: ReviewArtwork }) => (
  <article className="bg-white rounded-lg shadow-md p-6" data-testid={`review-${review.id}`}>
    <div className="flex items-baseline justify-between flex-wrap gap-2">
      <h3 className="text-lg font-semibold text-gray-900">{review.authorName}</h3>
      <time dateTime={review.createdAt} className="text-sm text-gray-500">
        {formatDate(review.createdAt)}
      </time>
    </div>
    {review.authorCity && <p className="text-sm text-gray-500">{review.authorCity}</p>}
    <Stars rating={review.rating} />
    <p className="mt-3 text-gray-700 whitespace-pre-line">{review.text}</p>
    {artwork && (
      <a
        href={`/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`}
        className="mt-3 inline-block text-primary-600 hover:underline"
      >
        {artwork.title}
      </a>
    )}
  </article>
);

const ReviewForm = () => {
  const [authorName, setAuthorName] = useState('');
  const [authorCity, setAuthorCity] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): string | null => {
    if (!authorName.trim()) {
      return 'Пожалуйста, укажите ваше имя';
    }
    if (!text.trim()) {
      return 'Пожалуйста, напишите текст отзыва';
    }
    if (text.length > TEXT_LIMIT) {
      return `Текст отзыва не должен превышать ${TEXT_LIMIT} символов`;
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await submitReview({
        authorName: authorName.trim(),
        authorCity: authorCity.trim() || undefined,
        text: text.trim(),
        rating,
      });
      setSuccess(true);
      setAuthorName('');
      setAuthorCity('');
      setText('');
      setRating(5);
    } catch (err) {
      setError('Не удалось отправить отзыв. Попробуйте немного позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Оставить отзыв" className="space-y-4 bg-gray-50 p-6 rounded-lg">
      <div>
        <label htmlFor="review-author-name" className="block text-sm font-medium text-gray-700 mb-1">
          Имя *
        </label>
        <input
          id="review-author-name"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label htmlFor="review-author-city" className="block text-sm font-medium text-gray-700 mb-1">
          Город
        </label>
        <input
          id="review-author-city"
          type="text"
          value={authorCity}
          onChange={(e) => setAuthorCity(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label htmlFor="review-rating" className="block text-sm font-medium text-gray-700 mb-1">
          Оценка
        </label>
        <select
          id="review-rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-1">
          Текст отзыва *
        </label>
        <textarea
          id="review-text"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
      >
        {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
      </button>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600">
          Спасибо! Ваш отзыв отправлен и появится на сайте после проверки модератором.
        </p>
      )}
    </form>
  );
};

const ReviewsClientPage = ({ reviews, artworksById }: ReviewsClientPageProps) => (
  <div className="min-h-screen flex flex-col">
    <Navigation />
    <main className="flex-grow">
      <section className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8">Отзывы</h1>

        {reviews.length === 0 ? (
          <p className="text-lg text-gray-600 mb-12" data-testid="reviews-empty-state">
            Отзывов пока нет — станьте первым, кто оставит отзыв о работах Анжелы!
          </p>
        ) : (
          <div className="space-y-6 mb-12">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                artwork={review.artworkId ? artworksById[review.artworkId] : undefined}
              />
            ))}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Оставить отзыв</h2>
          <ReviewForm />
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default ReviewsClientPage;
