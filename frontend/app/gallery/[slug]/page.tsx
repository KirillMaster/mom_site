import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getGalleryData, getImageUrl } from '@/hooks/useApi';
import { resolveArtworkBySlug, buildArtworkSlug } from '@/lib/artworkSlug';
import { isExhibitionPhoto } from '@/lib/gallery';
import AskPriceButton from './AskPriceButton';

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
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artworkSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav aria-label="breadcrumbs">
        <a href="/">Главная</a>
        <a href="/gallery">Галерея</a>
        <span>{artwork.title}</span>
      </nav>

      <h1>{artwork.title}</h1>

      <img src={getImageUrl(artwork.imagePath)} alt={artwork.title} />

      {artwork.description && <p>{artwork.description}</p>}
      {categoryName && <p>{categoryName}</p>}

      {priceLabel && <p>{priceLabel}</p>}
      {showPriceCta && <AskPriceButton title={artwork.title} id={artwork.id} />}

      {relatedWorks.length > 0 && (
        <section>
          <h2>Другие работы этой категории</h2>
          <ul>
            {relatedWorks.map((related: any) => (
              <li key={related.id}>
                <a href={`/gallery/${buildArtworkSlug(related.title, related.id)}`}>
                  {related.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default ArtworkPage;
