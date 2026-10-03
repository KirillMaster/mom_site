import Link from 'next/link';
import type { ReviewDto } from '@/lib/api';

const MAX_REVIEWS = 3;

interface Props {
  reviews?: ReviewDto[];
  prioritizeArtworkId?: number;
}

const ReviewsPreview = ({ reviews, prioritizeArtworkId }: Props) => {
  if (!reviews || reviews.length === 0) return null;

  const ordered =
    prioritizeArtworkId == null
      ? reviews
      : [
          ...reviews.filter((r) => r.artworkId === prioritizeArtworkId),
          ...reviews.filter((r) => r.artworkId !== prioritizeArtworkId),
        ];
  const shown = ordered.slice(0, MAX_REVIEWS);

  return (
    <section className="py-20 bg-paper-200" aria-labelledby="reviews-preview-heading">
      <div className="max-w-7xl mx-auto px-4">
        <h2 id="reviews-preview-heading" className="reveal text-4xl md:text-5xl font-serif font-medium mb-12 text-center">
          Отзывы
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {shown.map((review) => (
            <figure key={review.id} className="rounded-md border border-line bg-paper-50 p-6">
              <blockquote className="text-ink-600 leading-relaxed">{review.text}</blockquote>
              <figcaption className="mt-4 text-sm font-medium text-ink">
                {review.authorName}
                {review.authorCity ? `, ${review.authorCity}` : ''}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/reviews"
            className="font-medium text-sea hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Все отзывы
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ReviewsPreview;
