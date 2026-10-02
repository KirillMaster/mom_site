'use client';

import { ARTWORK_STATUSES, ARTWORK_STATUS_LABELS } from '@/lib/artworkStatus';
import type { ArtworkFormState } from './ArtworkFormFields';

interface Props {
  state: ArtworkFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const input = 'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500';
const label = 'block text-sm font-medium text-gray-700 mb-2';

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
        <input type="number" id="widthCm" name="widthCm" min={1} max={1000} value={state.widthCm}
          onChange={onChange} className={input} />
      </div>
      <div>
        <label htmlFor="heightCm" className={label}>Высота (см)</label>
        <input type="number" id="heightCm" name="heightCm" min={1} max={1000} value={state.heightCm}
          onChange={onChange} className={input} />
      </div>
    </div>
    <div>
      <label htmlFor="year" className={label}>Год</label>
      <input type="number" id="year" name="year" min={1950} value={state.year} onChange={onChange} className={input} />
    </div>
    <div>
      <label htmlFor="support" className={label}>Основа</label>
      <input type="text" id="support" name="support" maxLength={100} value={state.support}
        onChange={onChange} className={input} />
    </div>
    <div>
      <label htmlFor="technique" className={label}>Техника</label>
      <input type="text" id="technique" name="technique" maxLength={100} value={state.technique}
        onChange={onChange} className={input} />
    </div>
  </>
);

export default ArtworkSpecsFields;
