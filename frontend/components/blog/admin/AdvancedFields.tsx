'use client';

import type { ReactNode } from 'react';
import type { BlogCategory } from '@/types/blog';
import { fromLocalInput, toLocalInput, type PostForm } from '@/lib/blogForm';
import ArtworkPicker from './ArtworkPicker';

interface AdvancedFieldsProps {
  form: PostForm;
  categories: BlogCategory[];
  slugLocked: boolean;
  errors: Record<string, string>;
  onChange: (patch: Partial<PostForm>) => void;
}

const inputClass = 'w-full border rounded px-3 py-2 min-h-[44px]';

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return <span className={`text-xs ${over ? 'text-red-600' : 'text-gray-500'}`}>{value.length} / {max}</span>;
}

interface FieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <div className="flex justify-between items-baseline gap-2 mb-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
        {hint}
      </div>
      {children}
      {error && <p role="alert" className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function AdvancedFields({ form, categories, slugLocked, errors, onChange }: AdvancedFieldsProps) {
  const lockedHint = slugLocked
    ? <span className="text-xs text-gray-500">Новость опубликована — адрес не меняется</span>
    : undefined;

  return (
    <details className="card p-4 bg-white">
      <summary className="cursor-pointer font-medium min-h-[44px] flex items-center">
        Дополнительно (можно не трогать)
      </summary>
      <div className="space-y-4 mt-4">
        <Field id="post-category" label="Рубрика" error={errors.blogCategoryId}>
          <select
            id="post-category"
            className={inputClass}
            value={form.blogCategoryId ?? ''}
            onChange={(e) => onChange({ blogCategoryId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Новости (по умолчанию)</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field id="post-slug" label="Адрес страницы" error={errors.slug} hint={lockedHint}>
          <input
            id="post-slug"
            className={inputClass}
            value={form.slug}
            disabled={slugLocked}
            maxLength={120}
            onChange={(e) => onChange({ slug: e.target.value.toLowerCase(), slugTouched: true })}
          />
          <p className="text-xs text-gray-500 mt-1 break-all">angelamoiseenko.ru/blog/{form.slug || '…'}</p>
        </Field>

        <Field id="post-excerpt" label="Анонс" error={errors.excerpt} hint={<Counter value={form.excerpt} max={300} />}>
          <textarea
            id="post-excerpt"
            className={inputClass}
            rows={3}
            value={form.excerpt}
            placeholder="Пара предложений для списка новостей"
            onChange={(e) => onChange({ excerpt: e.target.value })}
          />
        </Field>

        <Field
          id="post-seo-title"
          label="Заголовок для поисковиков"
          error={errors.seoTitle}
          hint={<Counter value={form.seoTitle} max={70} />}
        >
          <input
            id="post-seo-title"
            className={inputClass}
            value={form.seoTitle}
            placeholder={form.title}
            onChange={(e) => onChange({ seoTitle: e.target.value })}
          />
        </Field>

        <Field
          id="post-seo-description"
          label="Описание для поисковиков"
          error={errors.seoDescription}
          hint={<Counter value={form.seoDescription} max={160} />}
        >
          <textarea
            id="post-seo-description"
            className={inputClass}
            rows={2}
            value={form.seoDescription}
            onChange={(e) => onChange({ seoDescription: e.target.value })}
          />
        </Field>

        <Field
          id="post-published-at"
          label="Дата публикации"
          error={errors.publishedAt}
          hint={<span className="text-xs text-gray-500">Будущая дата — новость появится сама</span>}
        >
          <input
            id="post-published-at"
            type="datetime-local"
            className={inputClass}
            value={toLocalInput(form.publishedAt)}
            onChange={(e) => onChange({ publishedAt: fromLocalInput(e.target.value) })}
          />
        </Field>

        <ArtworkPicker selected={form.artworkIds} onChange={(artworkIds) => onChange({ artworkIds })} />
      </div>
    </details>
  );
}
