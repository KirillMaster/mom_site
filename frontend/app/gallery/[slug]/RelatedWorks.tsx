import { getImageUrl } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import { normalizeTitle } from '@/lib/normalizeTitle';

export const MAX_RELATED = 8;

interface RelatedWorksProps {
  works: any[];
  categoryId?: number | null;
}

const RelatedWorks = ({ works, categoryId }: RelatedWorksProps) => {
  if (works.length === 0) {
    return null;
  }

  return (
        <section className="mt-16">
          <h2 className="mb-6 font-serif text-2xl font-semibold text-gray-900 md:text-3xl">
            Другие работы этой категории
          </h2>
          <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {works.slice(0, MAX_RELATED).map((related: any) => (
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
                    {normalizeTitle(related.title)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {categoryId != null && (
            <a
              href={`/gallery?category=${categoryId}`}
              className="mt-6 inline-block font-medium text-primary-700 hover:text-primary-800"
            >
              Смотреть все
            </a>
          )}
        </section>
  );
};

export default RelatedWorks;
