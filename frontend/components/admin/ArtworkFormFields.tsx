'use client';

import { slugifyTitle } from '@/lib/artworkSlug';
import type { ArtworkStatus } from '@/lib/artworkStatus';
import ArtworkSpecsFields from './ArtworkSpecsFields';

export interface ArtworkFormState {
  title: string;
  description: string;
  price: string;
  status: ArtworkStatus;
  widthCm: string;
  heightCm: string;
  year: string;
  support: string;
  technique: string;
  shortDescription: string;
  isFeatured: boolean;
  needsReshoot: boolean;
  isPublished: boolean;
  categoryId: string;
}

interface Props {
  state: ArtworkFormState;
  categories?: { id: number; name: string }[];
  artworkId?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const input = 'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500';
const label = 'block text-sm font-medium text-gray-700 mb-2';

const ArtworkFormFields = ({ state, categories, artworkId, onChange }: Props) => (
  <>
    <div>
      <label htmlFor="title" className={label}>Название</label>
      <input type="text" id="title" name="title" value={state.title} onChange={onChange} className={input} required />
      <p className="mt-2 text-xs text-gray-500">
        Адрес страницы:{' '}
        <code className="text-gray-700">/gallery/{slugifyTitle(state.title)}-{artworkId ?? 'ID'}</code>
        {!artworkId && ' — ID присваивается после сохранения'}
      </p>
    </div>
    <div>
      <label htmlFor="description" className={label}>Описание</label>
      <textarea id="description" name="description" value={state.description} onChange={onChange} rows={4} className={input}></textarea>
    </div>
    <div>
      <label htmlFor="price" className={label}>Цена (₽) <span className="text-gray-500 text-xs">(опционально)</span></label>
      <input type="number" id="price" name="price" value={state.price} onChange={onChange}
        placeholder="Оставьте пустым для 'Цена: договорная'" className={input} />
    </div>
    <div>
      <label htmlFor="categoryId" className={label}>Категория</label>
      <select id="categoryId" name="categoryId" value={state.categoryId} onChange={onChange} className={input} required>
        <option value="">Выберите категорию</option>
        {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
    <ArtworkSpecsFields state={state} onChange={onChange} />
  </>
);

export default ArtworkFormFields;
