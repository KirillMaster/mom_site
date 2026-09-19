import { notFound } from 'next/navigation';
import { getGalleryData, getImageUrl } from '@/hooks/useApi';
import { resolveArtworkBySlug, buildArtworkSlug } from '@/lib/artworkSlug';
import { isExhibitionPhoto } from '@/lib/gallery';
import AskPriceButton from './AskPriceButton';

export const dynamic = 'force-dynamic';

interface ArtworkPageProps {
  params: { slug: string };
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
