'use client';

import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArtworkImage } from '@/lib/api';
import { resolveStatus } from '@/lib/artworkStatus';
import ArtworkFormFields, { ArtworkFormState } from './ArtworkFormFields';
import ArtworkImagesManager from './ArtworkImagesManager';
import MultiImageDropzone from './MultiImageDropzone';
import { useArtworkSave } from './useArtworkSave';

interface Props {
  artwork: any | null;
  categories?: { id: number; name: string }[];
  onSaved: () => void;
}

const initialState = (a: any | null): ArtworkFormState => ({
  title: a?.title ?? '',
  description: a?.description || '',
  price: a?.price ? String(a.price) : '',
  status: a ? resolveStatus(a) : 'Available',
  widthCm: a?.widthCm ? String(a.widthCm) : '',
  heightCm: a?.heightCm ? String(a.heightCm) : '',
  year: a?.year ? String(a.year) : '',
  support: a?.support ?? '',
  technique: a?.technique ?? '',
  categoryId: a ? String(a.categoryId) : '',
});

const ArtworkForm = ({ artwork, categories, onSaved }: Props) => {
  const isEdit = !!artwork;
  const [state, setState] = useState(initialState(artwork));
  const [queue, setQueue] = useState<File[]>([]);
  const [images, setImages] = useState<ArtworkImage[]>(artwork?.images ?? []);
  const { submit, error, pending } = useArtworkSave(artwork, state, queue, onSaved);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const next = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setState((s) => ({ ...s, [name]: next }));
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <ArtworkFormFields state={state} categories={categories} artworkId={artwork?.id} onChange={handleChange} />
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">Фотографии</span>
        {isEdit && <ArtworkImagesManager artworkId={artwork.id} images={images} onChange={setImages} />}
        <div className="mt-4">
          <MultiImageDropzone files={queue} onChange={setQueue} existingCount={images.length} disabled={pending} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full flex items-center justify-center" disabled={pending}>
        {pending && <LoadingSpinner size="sm" className="mr-2" />}
        {isEdit ? 'Сохранить изменения' : 'Добавить картину'}
      </button>
    </form>
  );
};

export default ArtworkForm;
