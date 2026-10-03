import { normalizeTitle } from '@/lib/normalizeTitle';
import { getImageUrl } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import MuseumLabel from '@/components/artwork/MuseumLabel';
import type { ArtworkDto } from '@/lib/api';

export const MAX_RELATED = 8;

type RelatedWork = Pick<ArtworkDto, 'id' | 'title' | 'imagePath'> & Partial<ArtworkDto>;

interface RelatedWorksProps {
  works: RelatedWork[];
  categoryId?: number | null;
}

const RelatedWorks = ({ works, categoryId }: RelatedWorksProps) => {
  if (works.length === 0) {
    return null;
  }

  return (
      <section className="mt-16">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-ink md:text-3xl">
          Другие работы этой категории
        </h2>
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {works.slice(0, MAX_RELATED).map((related) => (
            <li key={related.id}>
              <a
                href={`/gallery/${buildArtworkSlug(related.title, related.id)}`}
                className="group block overflow-hidden rounded-md border border-line bg-paper-50 transition-colors hover:border-sea"
              >
                <div className="aspect-square overflow-hidden bg-paper-200">
                  <img
                    src={getImageUrl(related.thumbnailPath || related.imagePath)}
                    alt={normalizeTitle(related.title)}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <MuseumLabel artwork={related as ArtworkDto} as="p" size="sm" />
                </div>
              </a>
            </li>
          ))}
        </ul>
        {categoryId != null && (
          <a
            href={`/gallery?category=${categoryId}`}
            className="mt-6 inline-block font-medium text-sea hover:text-sea-700 hover:underline"
          >
            Смотреть все
          </a>
        )}
      </section>
  );
};

export default RelatedWorks;
