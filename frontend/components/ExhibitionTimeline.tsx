'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { exhibitions } from '@/data/biography';
import { Button } from '@/components/ui';

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
      <ol className="relative border-l-2 border-line ml-3">
        {exhibitions.map((entry, index) => (
          // The archive stays in the markup and is only hidden, so search
          // engines index every exhibition even while the page stays short.
          <li
            key={entry.year}
            className={`mb-10 ml-6 ${!expanded && index >= INITIAL_YEARS ? 'hidden' : ''}`}
          >
            <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-ochre ring-4 ring-paper" />
            <h3 className="text-2xl mb-3">{entry.year}</h3>
            <ul className="space-y-2">
              {entry.items.map((item) => (
                <li key={item} className="text-ink-600 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {!expanded && hiddenCount > 0 && (
        <Button variant="secondary" onClick={() => setExpanded(true)}>
          <span>Показать ранние выставки</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default ExhibitionTimeline;
