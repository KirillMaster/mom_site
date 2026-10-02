'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Star, Trash2 } from 'lucide-react';
import { ArtworkImage } from '@/lib/api';
import { getImageUrl } from '@/hooks/useApi';
import { deleteArtworkImage, reorderArtworkImages } from '@/lib/artworkImagesApi';
import { extractApiError } from '@/lib/artworkImageValidation';

interface Props {
  artworkId: number;
  images: ArtworkImage[];
  onChange: (images: ArtworkImage[]) => void;
}

const btn = 'p-1 rounded bg-white text-gray-700 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-700';

interface ControlsProps {
  image: ArtworkImage;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (image: ArtworkImage) => void;
}

const ImageControls = ({ image, index, count, onMove, onRemove }: ControlsProps) => (
  <>
    <img src={getImageUrl(image.thumbnailPath)} alt={`Фото ${index + 1}`} className="h-24 w-full object-cover rounded" />
    {index === 0 && (
      <span className="absolute top-2 left-2 px-2 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Обложка</span>
    )}
    <div className="flex justify-between mt-1">
      <button type="button" className={btn} aria-label={`Переместить фото ${index + 1} влево`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        <ArrowLeft className="w-4 h-4" />
      </button>
      {index > 0 && (
        <button type="button" className={btn} aria-label={`Сделать обложкой фото ${index + 1}`} title="Сделать обложкой" onClick={() => onMove(index, 0)}>
          <Star className="w-4 h-4" />
        </button>
      )}
      <button type="button" className={btn} aria-label={`Переместить фото ${index + 1} вправо`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
        <ArrowRight className="w-4 h-4" />
      </button>
      {count > 1 && (
        <button type="button" className={`${btn} hover:text-red-600`} aria-label={`Удалить фото ${index + 1}`} onClick={() => onRemove(image)}>
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  </>
);

const ArtworkImagesManager = ({ artworkId, images, onChange }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const run = async (action: () => Promise<ArtworkImage[]>, fallback: string) => {
    try {
      setError(null);
      onChange(await action());
    } catch (e) {
      setError(extractApiError(e, fallback));
    }
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return;
    const ids = images.map((i) => i.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    return run(() => reorderArtworkImages(artworkId, ids), 'Не удалось сохранить порядок фото');
  };

  const remove = (image: ArtworkImage) => {
    if (!window.confirm('Удалить это фото?')) return;
    return run(() => deleteArtworkImage(artworkId, image.id), 'Не удалось удалить фото');
  };

  return (
    <div>
      {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}
      <ul className="grid grid-cols-3 gap-3" data-testid="images-list">
        {images.map((image, index) => (
          <li
            key={image.id}
            data-testid="managed-image"
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
            }}
            className="relative border border-gray-200 rounded-md p-1 cursor-move"
          >
            <ImageControls image={image} index={index} count={images.length} onMove={move} onRemove={remove} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArtworkImagesManager;
