'use client';

import { useState } from 'react';
import { useArtworks } from '@/hooks/useApi';

interface ArtworkPickerProps {
  selected: number[];
  onChange: (ids: number[]) => void;
}

export default function ArtworkPicker({ selected, onChange }: ArtworkPickerProps) {
  const { data = [], isLoading } = useArtworks();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = data.filter((a) => a.title.toLowerCase().includes(needle));

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700 mb-1">Картины к новости</legend>
      <p className="text-sm text-gray-500 mb-2">Отмеченные картины покажем под статьёй.</p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Найти по названию"
        aria-label="Найти картину"
        className="w-full border rounded px-3 py-2 mb-2 min-h-[44px]"
      />
      {isLoading && <p className="text-sm text-gray-500">Загружаем картины…</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
        {visible.map((a) => {
          const checked = selected.includes(a.id);
          return (
            <label
              key={a.id}
              className={`border rounded p-1 cursor-pointer text-sm ${checked ? 'ring-2 ring-amber-600' : ''}`}
            >
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(a.id)} />
              {a.thumbnailPath && <img src={a.thumbnailPath} alt="" className="w-full h-24 object-cover rounded" />}
              <span className="block truncate mt-1">{a.title}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
