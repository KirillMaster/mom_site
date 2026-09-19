'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { exhibitions } from '@/data/biography';

const INITIAL_YEARS = 6;

/**
 * Nearly thirty years of exhibitions. Showing all of them at once buries the
 * rest of the page, so the recent years are open and the archive waits behind
 * one button.
 */
const ExhibitionTimeline = () => {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = exhibitions.length - INITIAL_YEARS;

  return (
    <div>
      <ol className="relative border-l-2 border-primary-100 ml-3">
        {exhibitions.map((entry, index) => (
          // The archive stays in the markup and is only hidden, so search
          // engines index every exhibition even while the page stays short.
          <li
            key={entry.year}
            className={`mb-10 ml-6 ${!expanded && index >= INITIAL_YEARS ? 'hidden' : ''}`}
          >
            <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 ring-4 ring-white" />
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3">{entry.year}</h3>
            <ul className="space-y-2">
              {entry.items.map((item) => (
                <li key={item} className="text-gray-700 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="btn-outline inline-flex items-center gap-2"
        >
          <span>Показать ранние выставки</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ExhibitionTimeline;
