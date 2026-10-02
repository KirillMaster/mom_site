'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { blogErrorMessage, uploadBlogImage } from '@/lib/blogApi';

interface CoverUploadProps {
  imagePath: string;
  onChange: (imagePath: string) => void;
}

export default function CoverUpload({ imagePath, onChange }: CoverUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setProgress(0);
    try {
      onChange(await uploadBlogImage(file, setProgress));
    } catch (e) {
      setError(blogErrorMessage(e, 'Не получилось загрузить обложку. Попробуйте ещё раз.'));
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">Обложка</span>
      {imagePath && (
        <img src={imagePath} alt="Обложка новости" className="w-full max-h-64 object-cover rounded mb-2" />
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary min-h-[44px] inline-flex items-center gap-2"
          onClick={() => input.current?.click()}
          disabled={progress !== null}
        >
          <ImagePlus size={18} /> {imagePath ? 'Заменить обложку' : 'Выбрать обложку'}
        </button>
        {imagePath && (
          <button
            type="button"
            className="btn-secondary min-h-[44px] inline-flex items-center gap-2"
            onClick={() => onChange('')}
          >
            <Trash2 size={18} /> Убрать
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="cover-input"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {progress !== null && <p className="text-sm text-gray-600 mt-2">Загружаем обложку… {progress}%</p>}
      {error && <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
