'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/hooks/useApi';
import type { ArtworkDto } from '@/lib/api';

const AUTOPLAY_MS = 3000;

/**
 * Featured works as a CSS scroll-snap strip: the slides are ordinary links in
 * the server HTML, so they can be scrolled and clicked before any JavaScript
 * runs. JS only adds autoplay and the dots.
 */
const ArtworkCarousel = ({ artworks }: { artworks: ArtworkDto[] }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  }, []);

  const onScroll = () => {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    if (!track || !first) return;
    setActive(Math.round(track.scrollLeft / first.offsetWidth));
  };

  useEffect(() => {
    if (paused || artworks.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      scrollToIndex(atEnd ? 0 : active + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [active, paused, artworks.length, scrollToIndex]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {artworks.map((artwork, index) => (
          <div
            key={artwork.id}
            className="snap-start shrink-0 basis-full sm:basis-1/2 lg:basis-1/3 px-2 pb-4"
          >
            <Link href="/gallery" className="card p-4 block h-full">
              {/* Same square frame as the gallery cards, so a tall
                  canvas is shown whole instead of cropped to a strip. */}
              <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={getImageUrl(artwork.imagePath)}
                  alt={artwork.title}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{artwork.title}</h3>
              <p className="text-sm text-gray-600">{artwork.category?.name}</p>
            </Link>
          </div>
        ))}
      </div>

      {artworks.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {artworks.map((artwork, index) => (
            <button
              key={artwork.id}
              type="button"
              aria-label={`Работа ${index + 1}`}
              aria-current={index === active}
              onClick={() => scrollToIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === active ? 'bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtworkCarousel;
