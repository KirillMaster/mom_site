'use client';

import { X } from 'lucide-react';
import type { PostForm } from '@/lib/blogForm';

interface PostPreviewProps {
  form: PostForm;
  onClose: () => void;
}

export default function PostPreview({ form, onClose }: PostPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-2 sm:p-8">
      <div role="dialog" aria-label="Предпросмотр" className="bg-white rounded w-full max-w-3xl">
        <div className="flex justify-between items-center border-b p-3">
          <span className="text-sm text-gray-500">Так новость увидят посетители</span>
          <button type="button" className="btn-secondary min-h-[44px] inline-flex items-center gap-1" onClick={onClose}>
            <X size={18} /> Закрыть
          </button>
        </div>
        <article className="p-4 sm:p-8">
          {form.coverImagePath && (
            <img src={form.coverImagePath} alt={form.coverAlt || form.title} className="w-full rounded mb-6" />
          )}
          <h1 className="text-3xl font-serif mb-6">{form.title || 'Без заголовка'}</h1>
          <div className="blog-body text-lg" dangerouslySetInnerHTML={{ __html: form.bodyHtml }} />
        </article>
      </div>
    </div>
  );
}
