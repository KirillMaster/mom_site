'use client';

import { useState, type UIEvent } from 'react';
import { Maximize2 } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { reachGoal, Goals } from '@/lib/analytics';

export interface GalleryPhoto {
  src: string;
  thumb: string;
}

interface ArtworkGalleryProps {
  photos: GalleryPhoto[];
  title: string;
}

const altFor = (title: string, index: number, total: number) =>
  total > 1 ? `${title} — фото ${index + 1}` : title;

interface PhotoNavigationProps {
  photos: GalleryPhoto[];
  active: number;
  onSelect: (index: number) => void;
}

// Mobile: dot indicators under the carousel. Desktop: clickable thumbnails.
const PhotoNavigation = ({ photos, active, onSelect }: PhotoNavigationProps) => (
  <>
    <div data-testid="gallery-dots" className="mt-3 flex justify-center gap-2 md:hidden">
      {photos.map((photo, index) => (
        <span
          key={photo.src}
          data-testid="gallery-dot"
          aria-current={index === active ? 'true' : undefined}
          className={`h-2 w-2 rounded-full ${index === active ? 'bg-gray-900' : 'bg-gray-300'}`}
        />
      ))}
    </div>

    <div data-testid="gallery-thumbs" className="mt-4 hidden gap-3 overflow-x-auto md:flex">
      {photos.map((photo, index) => (
        <button
          key={photo.src}
          type="button"
          data-testid="gallery-thumb"
          aria-label={`Показать фото ${index + 1}`}
          aria-current={index === active ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-2 ${
            index === active ? 'ring-primary-600' : 'ring-transparent hover:ring-gray-300'
          }`}
        >
          <img src={photo.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  </>
);

// Every photo is rendered once, in the server HTML. On mobile the track is a
// CSS scroll-snap carousel; from md up only the active slide is displayed and
// the thumbnail strip switches it.
const ArtworkGallery = ({ photos, title }: ArtworkGalleryProps) => {
  const [active, setActive] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const multi = photos.length > 1;

  const open = (index: number) => {
    setActive(index);
    setIsOpen(true);
    reachGoal(Goals.ArtworkView, { title });
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = event.currentTarget;
    if (clientWidth > 0) {
      setActive(Math.min(photos.length - 1, Math.round(scrollLeft / clientWidth)));
    }
  };

  return (
    <div>
      <div
        data-testid="gallery-track"
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-neutral-900/5 shadow-lg ring-1 ring-black/5 md:block md:overflow-visible"
      >
        {photos.map((photo, index) => (
          <div
            key={photo.src}
            data-active={index === active}
            className={`w-full shrink-0 snap-center ${index === active ? '' : 'md:hidden'}`}
          >
            <button
              type="button"
              onClick={() => open(index)}
              aria-label={`Открыть «${title}» в полном размере`}
              className="block w-full cursor-zoom-in"
            >
              <img
                src={photo.src}
                alt={altFor(title, index, photos.length)}
                loading={index === 0 ? 'eager' : 'lazy'}
                {...(index === 0 ? { fetchPriority: 'high' as const } : {})}
                className="mx-auto h-auto w-full max-h-[78vh] object-contain"
              />
            </button>
          </div>
        ))}
      </div>

      {multi && <PhotoNavigation photos={photos} active={active} onSelect={setActive} />}

      <button
        type="button"
        onClick={() => open(active)}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:border-primary-600 hover:text-primary-700"
      >
        <Maximize2 className="h-4 w-4" />
        Смотреть в полном размере
      </button>

      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        index={active}
        on={{ view: ({ index }) => setActive(index) }}
        slides={photos.map((photo, index) => ({ src: photo.src, alt: altFor(title, index, photos.length) }))}
        plugins={[Zoom]}
        zoom={{ maxZoomPixelRatio: 3, doubleTapDelay: 300 }}
        carousel={{ finite: !multi }}
        render={multi ? undefined : { buttonPrev: () => null, buttonNext: () => null }}
      />
    </div>
  );
};

export default ArtworkGallery;
