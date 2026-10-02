import { useState } from 'react';

export const GALLERY_PAGE_SIZE = 24;

interface Paging<T> {
  visible: T[];
  remaining: number;
  showMore: () => void;
}

// The counter belongs to a filter: changing resetKey (the selected category)
// drops back to the first page without an effect round-trip.
export function useGalleryPaging<T>(items: T[], resetKey: string | number | null): Paging<T> {
  const [state, setState] = useState<{ key: string | number | null; count: number }>({
    key: resetKey,
    count: GALLERY_PAGE_SIZE,
  });
  const count = state.key === resetKey ? state.count : GALLERY_PAGE_SIZE;

  const showMore = () => setState({ key: resetKey, count: count + GALLERY_PAGE_SIZE });

  return {
    visible: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    showMore,
  };
}
