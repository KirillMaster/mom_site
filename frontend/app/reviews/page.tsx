import { Metadata } from 'next';
import { getReviewsData, getGalleryData } from '@/hooks/useApi';
import ReviewsClientPage, { ReviewArtwork } from './ReviewsClientPage';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://angelamoiseenko.ru';
const ARTIST_NAME = 'Анжела Моисеенко';
const PAGE_URL = `${SITE_URL}/reviews`;

// SEO metadata is unique to this page (S4-AS10): distinct title/description
// from every other route, plus an explicit canonical link.
export async function generateMetadata(): Promise<Metadata> {
  const title = `Отзывы о картинах и творчестве — ${ARTIST_NAME}`;
  const description = `Читайте отзывы посетителей о картинах и творчестве художника-импрессиониста ${ARTIST_NAME}, оставьте свой отзыв.`;

  return {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title,
      description,
      url: PAGE_URL,
      type: 'website',
    },
  };
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const ReviewsPage = async () => {
  const reviews = await getReviewsData().catch(() => []);

  const galleryData = await getGalleryData().catch(() => null);
  const artworksById: Record<number, ReviewArtwork> = {};
  (galleryData?.artworks || []).forEach((artwork: any) => {
    artworksById[artwork.id] = { id: artwork.id, title: artwork.title };
  });

  const hasReviews = reviews.length > 0;

  // AggregateRating only appears once there is at least one published review
  // to aggregate (S4-AS12/S4-AS13) — an empty page must not fabricate a
  // rating out of nothing.
  const aggregateRatingSchema = hasReviews
    ? {
        '@context': 'https://schema.org',
        '@type': 'AggregateRating',
        itemReviewed: {
          '@type': 'Person',
          name: ARTIST_NAME,
        },
        ratingValue: average(reviews.map((review) => review.rating)).toFixed(1),
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      }
    : null;

  const reviewSchemas = reviews.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.authorName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.text,
    datePublished: review.createdAt,
  }));

  return (
    <>
      {aggregateRatingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
        />
      )}
      {reviewSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ReviewsClientPage reviews={reviews} artworksById={artworksById} />
    </>
  );
};

export default ReviewsPage;
