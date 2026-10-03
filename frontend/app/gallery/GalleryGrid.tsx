import type { ArtworkDto, CategoryDto } from '@/lib/api';
import { isExhibitionPhoto } from '@/lib/gallery';
import { Button } from '@/components/ui';
import GalleryCard from './GalleryCard';

const EAGER_IMAGES = 4;

interface GalleryGridProps {
  artworks: ArtworkDto[];
  categories: CategoryDto[];
  remaining: number;
  total: number;
  categoryKey: number | null;
  onShowMore: () => void;
  onReset: () => void;
  attribution?: string | null;
}

const GalleryGrid = ({ artworks, categories, remaining, total, categoryKey, onShowMore, onReset, attribution }: GalleryGridProps) => (
  <section className="py-16 bg-paper">
    <div className="max-w-7xl mx-auto px-4">
      {attribution && (
        <p className="mb-8 text-ink-600" data-testid="authorship-caption">
          {attribution}
        </p>
      )}
      <div
        key={categoryKey || 'all'}
        className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {artworks.map((artwork, index) => (
          <GalleryCard
            key={artwork.id}
            artwork={artwork}
            exhibition={isExhibitionPhoto(artwork, categories)}
            eager={index < EAGER_IMAGES}
          />
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-10 text-center">
          <Button onClick={onShowMore}>Показать ещё ({remaining})</Button>
        </div>
      )}

      {total === 0 && (
        <div className="rise-in text-center py-16">
          <p className="text-xl text-ink-500 mb-6">Ничего не найдено</p>
          <Button variant="secondary" onClick={onReset}>
            Сбросить
          </Button>
        </div>
      )}
    </div>
  </section>
);

export default GalleryGrid;
