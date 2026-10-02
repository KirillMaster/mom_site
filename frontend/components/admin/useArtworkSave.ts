import { useRef, useState } from 'react';
import { useCreateArtwork, useUpdateArtwork } from '@/hooks/useApi';
import { uploadArtworkImages } from '@/lib/artworkImagesApi';
import { extractApiError } from '@/lib/artworkImageValidation';
import { validateCatalogFields } from '@/lib/catalogLimits';
import type { ArtworkFormState } from './ArtworkFormFields';

const buildFormData = (state: ArtworkFormState, cover?: File) => {
  const fd = new FormData();
  Object.entries(state).forEach(([k, v]) => fd.append(k, String(v)));
  if (cover) fd.append('image', cover);
  return fd;
};

export function useArtworkSave(artwork: any | null, state: ArtworkFormState, queue: File[], onSaved: () => void) {
  const isEdit = !!artwork;
  const createMutation = useCreateArtwork();
  const updateMutation = useUpdateArtwork();
  const [error, setError] = useState<string | null>(null);
  const createdId = useRef<number | null>(null);

  const saveArtwork = async (): Promise<{ id: number; rest: File[] }> => {
    if (isEdit) {
      await updateMutation.mutateAsync({ id: artwork.id, data: buildFormData(state) });
      return { id: artwork.id, rest: queue };
    }
    if (createdId.current === null) {
      const created = await createMutation.mutateAsync(buildFormData(state, queue[0]));
      createdId.current = created.id;
    }
    return { id: createdId.current as number, rest: queue.slice(1) };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && queue.length === 0) {
      setError('Добавьте хотя бы одно фото');
      return;
    }
    const invalid = validateCatalogFields(state);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    try {
      const { id, rest } = await saveArtwork();
      if (rest.length > 0) await uploadArtworkImages(id, rest);
      onSaved();
    } catch (err) {
      const fallback = createdId.current !== null
        ? 'Работа создана, но часть фото не загрузилась — нажмите «Сохранить» ещё раз'
        : 'Не удалось сохранить работу или загрузить фото';
      setError(extractApiError(err, fallback));
    }
  };

  return { submit, error, pending: createMutation.isPending || updateMutation.isPending };
}
