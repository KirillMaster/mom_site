import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getGalleryData, getImageUrl } from '@/hooks/useApi';
import { resolveArtworkBySlug } from '@/lib/artworkSlug';
import { isExhibitionPhoto } from '@/lib/gallery';
import AskPriceButton from './AskPriceButton';
import ArtworkGallery from './ArtworkGallery';
import RelatedWorks from './RelatedWorks';
import {
  ARTIST_NAME,
  artworkPageUrl,
  buildArtworkSchema,
  buildBreadcrumbSchema,
  buildSeoDescription,
  buildSeoTitle,
} from './artworkSeo';
import { getArtworkPhotos } from '@/lib/artworkPhotos';

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

interface ArtworkPageProps {
  params: { slug: string };
}

// Metadata must never throw for an unresolvable slug — the page itself
// renders the 404 via notFound(); metadata simply falls back to empty so a
// missing artwork never turns into a 500 (S3 constraint on graceful 404s).
export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  let galleryData;
  try {
    galleryData = await getGalleryData();
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {};
  }
  const artwork = galleryData ? resolveArtworkBySlug(params.slug, galleryData.artworks) : null;

  if (!artwork) {
    return {};
  }

  const title = buildSeoTitle(artwork);
  const description = buildSeoDescription(artwork);
  const url = artworkPageUrl(artwork);
  const imageUrl = getImageUrl(artwork.imagePath);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: `${ARTIST_NAME} - Художник-импрессионист`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: artwork.title,
        },
      ],
      locale: 'ru_RU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);

const categoryIdOf = (artwork: any) => artwork.category?.id ?? artwork.categoryId;

const categoryNameOf = (artwork: any, categories: any[]) =>
  artwork.category?.name ?? categories?.find((category) => category.id === artwork.categoryId)?.name;

const ArtworkPage = async ({ params }: ArtworkPageProps) => {
  let galleryData;
  try {
    galleryData = await getGalleryData();
  } catch (error) {
    if ((error as any)?.response?.status === 404) {
      notFound();
    }
    throw error;
  }
  const artwork = galleryData ? resolveArtworkBySlug(params.slug, galleryData.artworks) : null;

  if (!artwork) {
    notFound();
  }

  const categories = galleryData?.categories || [];
  const showPriceCta = artwork.isForSale && !isExhibitionPhoto(artwork, categories);
  const priceLabel = artwork.isForSale
    ? artwork.price
      ? formatPrice(artwork.price)
      : 'цена по запросу'
    : null;

  const categoryName = categoryNameOf(artwork, categories);
  const photos = getArtworkPhotos(artwork);

  // Other for-sale works from the same category, excluding this one and
  // exhibition photos (S2-AS6/S2-AS7): an artwork alone in its category
  // simply gets no section at all.
  const relatedWorks = (galleryData?.artworks || []).filter(
    (candidate: any) =>
      candidate.id !== artwork.id &&
      candidate.isForSale &&
      !isExhibitionPhoto(candidate, categories) &&
      categoryIdOf(candidate) === categoryIdOf(artwork)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArtworkSchema(artwork, photos, categoryName)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(artwork)) }}
      />

      {/* pt-24 clears the fixed site header, which otherwise covers the top of
          the painting on this page. */}
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <nav aria-label="breadcrumbs" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="transition-colors hover:text-primary-600">Главная</Link>
          <span aria-hidden="true">/</span>
          <Link href="/gallery" className="transition-colors hover:text-primary-600">Галерея</Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900">{artwork.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          <ArtworkGallery
            photos={photos.map((photo) => ({ src: getImageUrl(photo.path), thumb: getImageUrl(photo.thumbPath) }))}
            title={artwork.title}
          />

          <aside className="lg:sticky lg:top-28">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
              {categoryName && (
                <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary-600">
                  {categoryName}
                </p>
              )}

              <h1 className="font-serif text-3xl font-bold text-gray-900 md:text-4xl">
                {artwork.title}
              </h1>

              {artwork.description && (
                <p className="mt-4 leading-relaxed text-gray-600">{artwork.description}</p>
              )}

              {priceLabel && (
                <p className="mt-6 text-2xl font-bold text-gray-900">{priceLabel}</p>
              )}

              {showPriceCta && (
                <div className="mt-6">
                  <AskPriceButton title={artwork.title} id={artwork.id} />
                </div>
              )}

              <Link
                href="/gallery"
                className="mt-6 inline-block text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                ← Вернуться в галерею
              </Link>
            </div>
          </aside>
        </div>

        <RelatedWorks works={relatedWorks} />
      </div>
    </div>
  );
};

export default ArtworkPage;
