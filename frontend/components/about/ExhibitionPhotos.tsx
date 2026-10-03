import Image from 'next/image';
import { getImageUrl } from '@/hooks/useApi';
import type { ArtworkDto } from '@/lib/api';
import { normalizeTitle } from '@/lib/normalizeTitle';

const SIZES = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';

const ExhibitionPhotos = ({ photos }: { photos?: ArtworkDto[] | null }) => {
  if (!Array.isArray(photos) || photos.length === 0) return null;

  return (
    <div className="mt-16" data-testid="exhibition-photos">
      <h3 className="mb-6">Фото с выставок</h3>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <li key={photo.id} className="relative aspect-square overflow-hidden rounded-md border border-line bg-paper-50">
            <Image
              src={getImageUrl(photo.thumbnailPath || photo.imagePath)}
              alt={normalizeTitle(photo.title) || 'Фото с выставки'}
              fill
              sizes={SIZES}
              loading={index < 4 ? 'eager' : 'lazy'}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExhibitionPhotos;
