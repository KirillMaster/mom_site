'use client';

import { ARTWORK_STATUSES, ARTWORK_STATUS_LABELS } from '@/lib/artworkStatus';
import { CATALOG_LIMITS } from '@/lib/catalogLimits';
import type { ArtworkFormState } from './ArtworkFormFields';

interface Props {
  state: ArtworkFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const input = 'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500';
const label = 'block text-sm font-medium text-gray-700 mb-2';

const FLAGS: ['isFeatured' | 'needsReshoot' | 'isPublished', string][] = [
  ['isFeatured', 'Сильная работа (показывать на главной)'],
  ['needsReshoot', 'Нужно переснять'],
  ['isPublished', 'Опубликована на сайте'],
];

const ArtworkSpecsFields = ({ state, onChange }: Props) => (
  <>
    <div>
      <label htmlFor="status" className={label}>Статус</label>
      <select id="status" name="status" value={state.status} onChange={onChange} className={input}>
        {ARTWORK_STATUSES.map((s) => <option key={s} value={s}>{ARTWORK_STATUS_LABELS[s]}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="widthCm" className={label}>Ширина (см)</label>
        <input type="number" id="widthCm" name="widthCm" min={CATALOG_LIMITS.sizeMin} max={CATALOG_LIMITS.sizeMax} value={state.widthCm}
          onChange={onChange} className={input} />
      </div>
      <div>
        <label htmlFor="heightCm" className={label}>Высота (см)</label>
        <input type="number" id="heightCm" name="heightCm" min={CATALOG_LIMITS.sizeMin} max={CATALOG_LIMITS.sizeMax} value={state.heightCm}
          onChange={onChange} className={input} />
      </div>
    </div>
    <div>
      <label htmlFor="year" className={label}>Год</label>
      <input type="number" id="year" name="year" min={CATALOG_LIMITS.yearMin} max={new Date().getFullYear()} value={state.year} onChange={onChange} className={input} />
    </div>
    <div>
      <label htmlFor="support" className={label}>Основа</label>
      <input type="text" id="support" name="support" maxLength={CATALOG_LIMITS.textMax} value={state.support}
        onChange={onChange} className={input} />
    </div>
    <div>
      <label htmlFor="technique" className={label}>Техника</label>
      <input type="text" id="technique" name="technique" maxLength={CATALOG_LIMITS.textMax} value={state.technique}
        onChange={onChange} className={input} />
    </div>
    <div>
      <label htmlFor="shortDescription" className={label}>Короткое описание</label>
      <textarea id="shortDescription" name="shortDescription" rows={2} maxLength={CATALOG_LIMITS.shortDescriptionMax}
        value={state.shortDescription} onChange={onChange} className={input} />
      <p className="mt-1 text-xs text-gray-500">{state.shortDescription.length}/{CATALOG_LIMITS.shortDescriptionMax}</p>
    </div>
    <div className="space-y-2">
      {FLAGS.map(([name, text]) => (
        <label key={name} className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name={name} checked={state[name]} onChange={onChange} />
          {text}
        </label>
      ))}
    </div>
  </>
);

export default ArtworkSpecsFields;
