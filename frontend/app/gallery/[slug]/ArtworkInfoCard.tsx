import Link from 'next/link';
import { isExhibitionPhoto } from '@/lib/gallery';
import { normalizeTitle, quotedTitle } from '@/lib/normalizeTitle';
import { resolveStatus } from '@/lib/artworkStatus';
import type { ArtworkDto, GalleryData } from '@/lib/api';
import AskPriceButton from './AskPriceButton';
import ArtworkSpecs from './ArtworkSpecs';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);

interface Props {
  artwork: ArtworkDto;
  categoryName?: string;
  categories: GalleryData['categories'];
}

const priceLabelOf = (artwork: ArtworkDto, available: boolean) => {
  if (!available) return null;
  return artwork.price ? formatPrice(artwork.price) : 'цена по запросу';
};

const ArtworkInfoCard = ({ artwork, categoryName, categories }: Props) => {
  const isExhibition = isExhibitionPhoto(artwork, categories);
  const available = resolveStatus(artwork) === 'Available';
  const priceLabel = priceLabelOf(artwork, available);

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
        {categoryName && (
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary-600">{categoryName}</p>
        )}

        <h1 className="font-serif text-3xl font-bold text-gray-900 md:text-4xl">{quotedTitle(artwork.title)}</h1>

        {artwork.shortDescription && <p className="mt-2 text-lg text-gray-700">{artwork.shortDescription}</p>}

        {artwork.description && <p className="mt-4 leading-relaxed text-gray-600">{artwork.description}</p>}

        {!isExhibition && <ArtworkSpecs artwork={artwork} />}

        {priceLabel && <p className="mt-6 text-2xl font-bold text-gray-900">{priceLabel}</p>}

        {!isExhibition && (
          <div className="mt-6">
            <AskPriceButton
              title={normalizeTitle(artwork.title)}
              id={artwork.id}
              variant={available ? 'price' : 'similar'}
            />
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
  );
};

export default ArtworkInfoCard;
