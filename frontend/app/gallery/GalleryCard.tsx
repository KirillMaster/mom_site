import Link from 'next/link';
import { getImageUrl } from '@/hooks/useApi';
import type { ArtworkDto } from '@/lib/api';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import { normalizeTitle } from '@/lib/normalizeTitle';
import MuseumLabel from '@/components/artwork/MuseumLabel';

interface GalleryCardProps {
  artwork: ArtworkDto;
  exhibition: boolean;
  eager: boolean;
}

// The whole card is one link to the artwork page (US4-AS3): no nested
// buttons, so a tap anywhere opens the work.
const GalleryCard = ({ artwork, exhibition, eager }: GalleryCardProps) => {
  const title = normalizeTitle(artwork.title);

  return (
    <Link
      href={`/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`}
      aria-label={title}
      className="rise-in group block overflow-hidden rounded-md border border-line bg-paper-50"
    >
      <div className="relative overflow-hidden aspect-square bg-paper-200">
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
      <div className="p-5">
        <span className="text-sm font-medium text-sea">{artwork.category?.name || 'Без категории'}</span>
        <div className="mt-2">
          <MuseumLabel artwork={artwork} exhibition={exhibition} as="h3" size="sm" />
        </div>
      </div>
    </Link>
  );
};

export default GalleryCard;
