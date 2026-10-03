import Link from 'next/link';
import { getImageUrl } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import { normalizeTitle } from '@/lib/normalizeTitle';
import type { BlogRelatedArtwork } from '@/types/blog';

interface RelatedArtworksProps {
  artworks: BlogRelatedArtwork[];
}

export default function RelatedArtworks({ artworks }: RelatedArtworksProps) {
  if (!artworks.length) return null;
  return (
    <section aria-labelledby="related-artworks" className="mt-12">
      <h2 id="related-artworks" className="mb-4 font-serif text-2xl font-bold text-gray-900">Работы по теме</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {artworks.map((artwork) => (
          <li key={artwork.id} data-testid="related-artwork">
            <Link href={`/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`} className="group block">
              <img
                src={getImageUrl(artwork.thumbnailPath)}
                alt={normalizeTitle(artwork.title)}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover transition-opacity group-hover:opacity-90"
              />
              <span className="mt-2 block text-sm font-medium text-gray-900">{normalizeTitle(artwork.title)}</span>
              <span className="text-sm text-primary-600">
                {artwork.isForSale ? 'Купить или узнать цену' : 'Работа продана'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
