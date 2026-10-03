import Link from 'next/link';
import { getImageUrl } from '@/hooks/useApi';
import type { ArtworkDto } from '@/lib/api';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import { normalizeTitle } from '@/lib/normalizeTitle';
import { priceLabel, sizeLabel } from '@/lib/galleryCard';

interface GalleryCardProps {
  artwork: ArtworkDto;
  exhibition: boolean;
  eager: boolean;
}

// The whole card is one link to the artwork page (US4-AS3): no nested
// buttons, so a tap anywhere opens the work.
const GalleryCard = ({ artwork, exhibition, eager }: GalleryCardProps) => {
  const title = normalizeTitle(artwork.title);
  const price = priceLabel(artwork, exhibition);
  const size = sizeLabel(artwork);

  return (
    <Link
      href={`/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`}
      aria-label={title}
      className="rise-in card group block"
    >
      <div className="relative overflow-hidden aspect-square bg-neutral-100">
        <img
          src={getImageUrl(artwork.thumbnailPath)}
          alt={title}
          loading={eager ? 'eager' : 'lazy'}
          decoding={eager ? 'auto' : 'async'}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
        {artwork.images?.length > 1 && (
          <span
            data-testid="photo-count-badge"
            className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white"
          >
            📷 {artwork.images.length}
          </span>
        )}
      </div>
      <div className="p-6">
        <span className="text-sm text-primary-600 font-medium">
          {artwork.category?.name || 'Без категории'}
        </span>
        <h3 className="text-xl font-serif font-semibold my-2 text-gray-900">{title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-700">
          {size && <span>{size}</span>}
          {price && <span className="font-bold text-gray-900">{price}</span>}
        </div>
      </div>
    </Link>
  );
};

export default GalleryCard;
