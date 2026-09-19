import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getGalleryData, getImageUrl } from '@/hooks/useApi';
import { resolveArtworkBySlug, buildArtworkSlug } from '@/lib/artworkSlug';
import { isExhibitionPhoto } from '@/lib/gallery';
import AskPriceButton from './AskPriceButton';
import ArtworkViewer from './ArtworkViewer';

export const dynamic = 'force-dynamic';

interface ArtworkPageProps {
  params: { slug: string };
}

const SITE_URL = 'https://angelamoiseenko.ru';
const ARTIST_NAME = 'Анжела Моисеенко';

const artworkPageUrl = (artwork: any) => `${SITE_URL}/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`;

// SEO title/description are per-artwork (S3-AS1): unique, contain the
// artwork title and the commercial term "купить", kept close to the usual
// <title>/<meta description> length budgets.
const buildSeoTitle = (artwork: any) => `Купить картину «${artwork.title}» — ${ARTIST_NAME}`;

const buildSeoDescription = (artwork: any) => {
  const details = artwork.description ? `${artwork.description}. ` : '';
  const text = `«${artwork.title}» — ${details}Купить картину художника ${ARTIST_NAME} с доставкой.`;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
};

// Metadata must never throw for an unresolvable slug — the page itself
// renders the 404 via notFound(); metadata simply falls back to empty so a
// missing artwork never turns into a 500 (S3 constraint on graceful 404s).
export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const galleryData = await getGalleryData();
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
  const galleryData = await getGalleryData();
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

  // schema.org markup (S3-AS4/S3-AS5/S3-AS6): the artwork block only gets an
  // "offers" entry when it is actually for sale with a known price — an
  // artwork without a price stays honest and omits the whole offers key
  // rather than inventing one.
  const artworkSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    image: getImageUrl(artwork.imagePath),
    description: artwork.description || categoryName || artwork.title,
    creator: {
      '@type': 'Person',
      name: ARTIST_NAME,
    },
  };
  if (artwork.description) {
    artworkSchema.artMedium = artwork.description;
  }
  if (artwork.isForSale && artwork.price) {
    artworkSchema.offers = {
      '@type': 'Offer',
      price: artwork.price,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
      url: artworkPageUrl(artwork),
    };
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Галерея', item: `${SITE_URL}/gallery` },
      { '@type': 'ListItem', position: 3, name: artwork.title, item: artworkPageUrl(artwork) },
    ],
  };

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artworkSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* pt-24 clears the fixed site header, which otherwise covers the top of
          the painting on this page. */}
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <nav aria-label="breadcrumbs" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <a href="/" className="transition-colors hover:text-primary-600">Главная</a>
          <span aria-hidden="true">/</span>
          <a href="/gallery" className="transition-colors hover:text-primary-600">Галерея</a>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900">{artwork.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          <ArtworkViewer
            src={getImageUrl(artwork.imagePath)}
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

              <a
                href="/gallery"
                className="mt-6 inline-block text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                ← Вернуться в галерею
              </a>
            </div>
          </aside>
        </div>

        {relatedWorks.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-serif text-2xl font-semibold text-gray-900 md:text-3xl">
              Другие работы этой категории
            </h2>
            <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {relatedWorks.map((related: any) => (
                <li key={related.id}>
                  <a
                    href={`/gallery/${buildArtworkSlug(related.title, related.id)}`}
                    className="group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-square overflow-hidden bg-neutral-100">
                      <img
                        src={getImageUrl(related.thumbnailPath || related.imagePath)}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="block p-3 text-sm font-medium text-gray-900">
                      {related.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default ArtworkPage;
