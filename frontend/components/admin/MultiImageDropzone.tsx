'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { validateNewFiles } from '@/lib/artworkImageValidation';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  existingCount?: number;
  disabled?: boolean;
}

const MultiImageDropzone = ({ files, onChange, existingCount = 0, disabled }: Props) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const addFiles = (incoming: FileList | File[]) => {
    const result = validateNewFiles(Array.from(incoming), existingCount + files.length);
    setErrors(result.errors);
    if (result.accepted.length > 0) onChange([...files, ...result.accepted]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) addFiles(e.dataTransfer.files);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div>
      <div
        data-testid="dropzone"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-md p-4 text-center text-sm text-gray-600 cursor-pointer ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        Перетащите фото сюда или нажмите, чтобы выбрать (до 10 фото, каждое до 15 МБ)
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          aria-label="Выбрать фото"
          onChange={handleInput}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
          className="hidden"
        />
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 text-sm text-red-600 list-disc pl-5">
          {errors.map((msg) => <li key={msg}>{msg}</li>)}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="relative" data-testid="queued-preview">
              <img src={urls[i]} alt={`Предпросмотр: ${file.name}`} className="h-24 w-full object-cover rounded-md shadow-md" />
              <button
                type="button"
                aria-label={`Убрать из очереди ${file.name}`}
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-white rounded-full p-1 text-gray-700 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MultiImageDropzone;
