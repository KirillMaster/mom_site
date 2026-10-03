import { renderHook, act } from '@testing-library/react';
import { useGalleryPaging, GALLERY_PAGE_SIZE } from '@/lib/useGalleryPaging';

describe('@US4-AS11 useGalleryPaging displays 24 items per page', () => {
  it('shows 24 items when gallery has at least 24 items', () => {
    const items = Array.from({ length: 48 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(24);
    expect(result.current.visible).toEqual(items.slice(0, 24));
  });

  it('shows fewer items when gallery has less than 24 items', () => {
    const items = Array.from({ length: 10 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(10);
  });

  it('shows zero items when gallery is empty', () => {
    const { result } = renderHook(() => useGalleryPaging([], 'all'));

    expect(result.current.visible).toHaveLength(0);
    expect(result.current.remaining).toBe(0);
  });
});

describe('@US4-AS12 useGalleryPaging "Показать ещё" loads next 24 items', () => {
  it('adds 24 more items when showMore is called', () => {
    const items = Array.from({ length: 72 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(24);
    expect(result.current.remaining).toBe(48);

    act(() => {
      result.current.showMore();
    });

    expect(result.current.visible).toHaveLength(48);
    expect(result.current.remaining).toBe(24);
  });

  it('can be called multiple times to load all items', () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(24);

    act(() => {
      result.current.showMore(); // Show 48
    });
    expect(result.current.visible).toHaveLength(48);

    act(() => {
      result.current.showMore(); // Show 72
    });
    expect(result.current.visible).toHaveLength(72);

    act(() => {
      result.current.showMore(); // Show 96
    });
    expect(result.current.visible).toHaveLength(96);
  });

  it('does not load beyond array length', () => {
    const items = Array.from({ length: 50 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(24);

    act(() => {
      result.current.showMore();
    });

    expect(result.current.visible).toHaveLength(48);
    expect(result.current.remaining).toBe(2);

    act(() => {
      result.current.showMore();
    });

    expect(result.current.visible).toHaveLength(50);
    expect(result.current.remaining).toBe(0);
  });
});

describe('@US4-AS13 useGalleryPaging hides button when all items shown', () => {
  it('returns 0 remaining when all items are visible', () => {
    const items = Array.from({ length: 20 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.remaining).toBe(0);
  });

  it('returns remaining count when not all items shown', () => {
    const items = Array.from({ length: 48 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.remaining).toBe(24);
  });

  it('decreases remaining after showMore', () => {
    const items = Array.from({ length: 72 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.remaining).toBe(48);

    act(() => {
      result.current.showMore();
    });

    expect(result.current.remaining).toBe(24);

    act(() => {
      result.current.showMore();
    });

    expect(result.current.remaining).toBe(0);
  });
});

describe('@US4-EC5 useGalleryPaging boundary cases with specific item counts', () => {
  it('handles exactly 23 items (less than one page)', () => {
    const items = Array.from({ length: 23 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(23);
    expect(result.current.remaining).toBe(0);
  });

  it('handles exactly 24 items (one page)', () => {
    const items = Array.from({ length: 24 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(24);
    expect(result.current.remaining).toBe(0);
  });

  it('handles exactly 25 items (one page + 1)', () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(24);
    expect(result.current.remaining).toBe(1);

    act(() => {
      result.current.showMore();
    });

    expect(result.current.visible).toHaveLength(25);
    expect(result.current.remaining).toBe(0);
  });

  it('handles exactly 48 items (two pages)', () => {
    const items = Array.from({ length: 48 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(24);
    expect(result.current.remaining).toBe(24);

    act(() => {
      result.current.showMore();
    });

    expect(result.current.visible).toHaveLength(48);
    expect(result.current.remaining).toBe(0);
  });
});

describe('@US4-EC6 useGalleryPaging resets when category filter changes', () => {
  it('resets to first page when resetKey changes', () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result, rerender } = renderHook(
      ({ items: i, key }: { items: number[]; key: string | number | null }) =>
        useGalleryPaging(i, key),
      {
        initialProps: { items, key: 'all' },
      }
    );

    // Load more items
    act(() => {
      result.current.showMore();
    });
    expect(result.current.visible).toHaveLength(48);

    // Change category (change resetKey)
    rerender({ items, key: 'landscape' });

    // Should reset to first page
    expect(result.current.visible).toHaveLength(24);
  });

  it('preserves page count when resetKey stays the same but items change', () => {
    const items1 = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result, rerender } = renderHook(
      ({ items: i, key }: { items: number[]; key: string }) =>
        useGalleryPaging(i, key),
      {
        initialProps: { items: items1, key: 'all' },
      }
    );

    // Load more
    act(() => {
      result.current.showMore();
    });
    expect(result.current.visible).toHaveLength(48);

    // Change items but keep key the same
    const items2 = Array.from({ length: 150 }, (_, i) => i + 101);
    rerender({ items: items2, key: 'all' });

    // Should keep showing 48 items
    expect(result.current.visible).toHaveLength(48);
  });

  it('null resetKey works same as string key', () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result, rerender } = renderHook(
      ({ items: i, key }: { items: number[]; key: string | number | null }) =>
        useGalleryPaging(i, key),
      {
        initialProps: { items, key: null as string | number | null },
      }
    );

    act(() => {
      result.current.showMore();
    });
    expect(result.current.visible).toHaveLength(48);

    // Change from null to 'all'
    rerender({ items, key: 'all' as string | number | null });
    expect(result.current.visible).toHaveLength(24);
  });
});

describe('@US4-EC7 useGalleryPaging page size constant', () => {
  it('GALLERY_PAGE_SIZE is exactly 24', () => {
    expect(GALLERY_PAGE_SIZE).toBe(24);
  });

  it('uses GALLERY_PAGE_SIZE for initial load', () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    expect(result.current.visible).toHaveLength(GALLERY_PAGE_SIZE);
  });

  it('increments by GALLERY_PAGE_SIZE on showMore', () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => useGalleryPaging(items, 'all'));

    const initialCount = result.current.visible.length;

    act(() => {
      result.current.showMore();
    });

    expect(result.current.visible).toHaveLength(initialCount + GALLERY_PAGE_SIZE);
  });
});
