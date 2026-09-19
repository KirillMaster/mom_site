'use client';

import { useState } from 'react';
import { Eye, Maximize2 } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { reachGoal, Goals } from '@/lib/analytics';

interface ArtworkViewerProps {
  src: string;
  title: string;
}

// The artwork page shows the painting large and undisturbed; the lightbox is
// the same full-screen view the gallery's eye button opens, reachable here
// both by clicking the painting and by an explicit button under it.
const ArtworkViewer = ({ src, title }: ArtworkViewerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    setIsOpen(true);
    reachGoal(Goals.ArtworkView, { title });
  };

  return (
    <div>
      <button
        type="button"
        onClick={open}
        aria-label={`Открыть «${title}» в полном размере`}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-neutral-900/5 shadow-lg ring-1 ring-black/5"
      >
        <img
          src={src}
          alt={title}
          className="mx-auto h-auto w-full max-h-[78vh] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
            <Eye className="h-6 w-6" />
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={open}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:border-primary-600 hover:text-primary-700"
      >
        <Maximize2 className="h-4 w-4" />
        Смотреть в полном размере
      </button>

      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        slides={[{ src, alt: title }]}
      />
    </div>
  );
};

export default ArtworkViewer;
