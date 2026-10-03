import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/hooks/useApi';
import type { ArtworkDto } from '@/lib/api';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import { normalizeTitle } from '@/lib/normalizeTitle';
import MuseumLabel from '@/components/artwork/MuseumLabel';

const AvailableGrid = ({ artworks }: { artworks?: ArtworkDto[] }) => {
  if (!artworks || artworks.length === 0) return null;

  return (
    <section className="py-20 bg-paper-50" aria-labelledby="available-heading">
      <div className="max-w-7xl mx-auto px-4">
        <h2 id="available-heading" className="reveal text-4xl md:text-5xl font-serif font-medium mb-12 text-center">
          Сейчас в наличии
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {artworks.map((artwork) => (
            <li key={artwork.id}>
              <Link
                href={`/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`}
                aria-label={normalizeTitle(artwork.title)}
                className="group block h-full overflow-hidden rounded-md border border-line bg-paper-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <div className="relative aspect-square bg-paper-200">
                  <Image
                    src={getImageUrl(artwork.thumbnailPath || artwork.imagePath)}
                    alt={normalizeTitle(artwork.title)}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <MuseumLabel artwork={artwork} as="h3" size="sm" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default AvailableGrid;
