import {
  artworksForSale, isExhibitionPhoto, sizeClass, filterArtworks, parseFilters, filtersToQuery, defaultCatalogue, NO_FILTERS, isAvailable,
} from '@/lib/gallery';
import { GalleryData } from '@/lib/api';

const galleryData = {
  categories: [
    { id: 1, name: 'Театральные работы' },
    { id: 4, name: 'Фото с выставок' },
  ],
  artworks: [
    { id: 10, title: 'Премьера', categoryId: 1, category: { id: 1, name: 'Театральные работы' } },
    { id: 11, title: 'Открытие выставки', categoryId: 4, category: { id: 4, name: 'Фото с выставок' } },
    // The API does not always inline the category, so the id has to resolve too.
    { id: 12, title: 'Гости вернисажа', categoryId: 4 },
  ],
} as unknown as GalleryData;

describe('the exhibition photo category', () => {
  it('stays out of the catalogue of works for sale', () => {
    expect(artworksForSale(galleryData).map((a: any) => a.id)).toEqual([10]);
  });

  it('is recognised through the category list when the artwork has no inline category', () => {
    expect(isExhibitionPhoto(galleryData.artworks[2], galleryData.categories)).toBe(true);
  });

  it('is matched by name whatever the casing and padding', () => {
    const artwork = { categoryId: 9, category: { id: 9, name: '  фото С Выставок ' } };
    expect(isExhibitionPhoto(artwork, galleryData.categories)).toBe(true);
  });

  it('leaves paintings alone', () => {
    expect(isExhibitionPhoto(galleryData.artworks[0], galleryData.categories)).toBe(false);
  });
});

describe('@US5-FE1 size classes by the longer side', () => {
  it('classifies the boundaries', () => {
    expect(sizeClass(40, 30)).toBe('S');
    expect(sizeClass(10, 41)).toBe('M');
    expect(sizeClass(80, 50)).toBe('M');
    expect(sizeClass(10, 81)).toBe('L');
    expect(sizeClass(null, 10)).toBeNull();
  });
});

describe('@US5-EC2 only one side given', () => {
  it('belongs to no class and no size filter keeps it', () => {
    expect(sizeClass(undefined, 50)).toBeNull();
    expect(sizeClass(50, undefined)).toBeNull();
    const data = { categories: [], artworks: [{ id: 1, categoryId: 1, widthCm: 50, status: 'Available' }] } as unknown as GalleryData;
    for (const size of ['S', 'M', 'L'] as const) {
      expect(filterArtworks(data, { ...NO_FILTERS, size })).toEqual([]);
    }
  });
});

const cats = [
  { id: 1, name: 'Пейзаж' },
  { id: 2, name: 'Пейзажи Всеволода Сухоруких' },
  { id: 4, name: 'Фото с выставок' },
];
const mk = (id: number, categoryId: number, w: number | null, h: number | null, status = 'Available') =>
  ({ id, categoryId, widthCm: w, heightCm: h, status, category: cats.find((c) => c.id === categoryId) });
const mixed = {
  categories: cats,
  artworks: [mk(1, 1, 30, 30), mk(2, 1, 60, 50, 'Sold'), mk(3, 1, 60, 50), mk(4, 1, 100, 80), mk(5, 1, null, null), mk(6, 2, 60, 50), mk(7, 4, 60, 50)],
} as unknown as GalleryData;
const ids = (list: any[]) => list.map((a) => a.id);

describe('@US5-AS1 size M filter', () => {
  it('keeps the 60x50 works, drops others and works without size', () => {
    expect(ids(filterArtworks(mixed, { ...NO_FILTERS, size: 'M' }))).toEqual([2, 3]);
  });
});

describe('@US5-AS2 default view', () => {
  it('excludes the other author and exhibition photos', () => {
    expect(ids(defaultCatalogue(mixed))).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('@US5-AS3 Sukhorukikh section', () => {
  it('selecting its category shows only its works', () => {
    expect(ids(filterArtworks(mixed, { ...NO_FILTERS, category: 2 }))).toEqual([6]);
  });
});

describe('@US5-FE2 filters combine', () => {
  it('category + size + available all apply', () => {
    expect(ids(filterArtworks(mixed, { category: 1, size: 'M', available: true }))).toEqual([3]);
    expect(filterArtworks(mixed, { category: 1, size: 'S', available: true }).length).toBe(1);
  });
});

describe('@US5-AS5 filters live in the URL', () => {
  it('round-trips through the query string', () => {
    const filters = { category: 1, size: 'M' as const, available: true };
    expect(filtersToQuery(filters)).toBe('?category=1&size=M&available=1');
    expect(parseFilters(filtersToQuery(filters))).toEqual(filters);
  });
  it('ignores garbage and renders an empty query for no filters', () => {
    expect(parseFilters('?size=XL&category=abc&available=yes')).toEqual(NO_FILTERS);
    expect(filtersToQuery(NO_FILTERS)).toBe('');
  });
});

describe('@US5-EC1 categories missing', () => {
  it('everything stays visible when the special categories do not exist', () => {
    const data = { categories: [{ id: 1, name: 'Пейзаж' }], artworks: [mk(1, 1, 30, 30), mk(2, 1, 60, 50)] } as unknown as GalleryData;
    expect(ids(defaultCatalogue(data))).toEqual([1, 2]);
  });
});

describe('@US5-FE1 size class boundaries - degradation mode', () => {
  it('exactly at 40 cm is S, 41 cm is M', () => {
    expect(sizeClass(40, 30)).toBe('S');
    expect(sizeClass(30, 40)).toBe('S');
    expect(sizeClass(41, 30)).toBe('M');
    expect(sizeClass(30, 41)).toBe('M');
  });

  it('exactly at 80 cm is M, 81 cm is L', () => {
    expect(sizeClass(80, 30)).toBe('M');
    expect(sizeClass(30, 80)).toBe('M');
    expect(sizeClass(81, 30)).toBe('L');
    expect(sizeClass(30, 81)).toBe('L');
  });

  it('off-by-one at boundaries with different orientations', () => {
    expect(sizeClass(39, 50)).toBe('M');
    expect(sizeClass(50, 39)).toBe('M');
    expect(sizeClass(79, 50)).toBe('M');
    expect(sizeClass(50, 79)).toBe('M');
    expect(sizeClass(82, 50)).toBe('L');
    expect(sizeClass(50, 82)).toBe('L');
  });

  it('handles zero and negative dimensions', () => {
    expect(sizeClass(0, 50)).toBeNull();
    expect(sizeClass(50, 0)).toBeNull();
    expect(sizeClass(-10, 50)).toBeNull();
    expect(sizeClass(50, -10)).toBeNull();
    expect(sizeClass(-40, -30)).toBeNull();
  });

  it('handles very large dimensions', () => {
    expect(sizeClass(1000, 500)).toBe('L');
    expect(sizeClass(10000, 5000)).toBe('L');
    expect(sizeClass(Infinity, 50)).toBe('L');
  });

  it('S, M, L maintain class identity for boundary values', () => {
    const sClass = sizeClass(25, 30);
    const mClass = sizeClass(60, 50);
    const lClass = sizeClass(100, 80);
    expect(sClass).toBe('S');
    expect(mClass).toBe('M');
    expect(lClass).toBe('L');
  });
});

describe('@US5-AS5 parseFilters URL params - degradation mode', () => {
  it('US5-AS5 category=0 is treated as no filter', () => {
    expect(parseFilters('?category=0')).toEqual(NO_FILTERS);
  });

  it('US5-AS5 negative category is rejected', () => {
    expect(parseFilters('?category=-1')).toEqual(NO_FILTERS);
  });

  it('US5-AS5 category with decimal is rejected', () => {
    expect(parseFilters('?category=1.5')).toEqual(NO_FILTERS);
  });

  it('US5-AS5 invalid size values are rejected (only uppercase S, M, L accepted)', () => {
    expect(parseFilters('?size=s')).toEqual({ ...NO_FILTERS, size: null });
    expect(parseFilters('?size=m')).toEqual({ ...NO_FILTERS, size: null });
    expect(parseFilters('?size=l')).toEqual({ ...NO_FILTERS, size: null });
    expect(parseFilters('?size=XL')).toEqual({ ...NO_FILTERS, size: null });
  });

  it('US5-AS5 available=0 is false, available=1 is true', () => {
    expect(parseFilters('?available=1').available).toBe(true);
    expect(parseFilters('?available=0').available).toBe(false);
  });

  it('US5-AS5 available with any value other than "1" is false', () => {
    expect(parseFilters('?available=true').available).toBe(false);
    expect(parseFilters('?available=yes').available).toBe(false);
    expect(parseFilters('?available=on').available).toBe(false);
  });

  it('US5-AS5 empty search string returns no filters', () => {
    expect(parseFilters('')).toEqual(NO_FILTERS);
  });

  it('US5-AS5 multiple filters are combined', () => {
    expect(parseFilters('?category=5&size=L&available=1')).toEqual({
      category: 5,
      size: 'L',
      available: true,
    });
  });

  it('US5-AS5 duplicate params use first value', () => {
    expect(parseFilters('?category=1&category=2')).toEqual({
      ...NO_FILTERS,
      category: 1,
    });
  });

  it('US5-AS5 extra params are ignored', () => {
    expect(parseFilters('?category=1&foo=bar&size=M')).toEqual({
      category: 1,
      size: 'M',
      available: false,
    });
  });
});

describe('@US5-AS5 filtersToQuery URL generation - degradation mode', () => {
  it('US5-AS5 generates correct query for all combinations', () => {
    expect(filtersToQuery({ category: 5, size: 'S', available: false })).toBe('?category=5&size=S');
    expect(filtersToQuery({ category: null, size: 'M', available: true })).toBe('?size=M&available=1');
    expect(filtersToQuery({ category: 10, size: null, available: true })).toBe('?category=10&available=1');
  });

  it('US5-AS5 omits null/false values', () => {
    expect(filtersToQuery(NO_FILTERS)).toBe('');
  });

  it('US5-AS5 includes category even if size is null', () => {
    expect(filtersToQuery({ category: 1, size: null, available: false })).toBe('?category=1');
  });

  it('US5-AS5 roundtrip with parseFilters is idempotent', () => {
    const test = { category: 2, size: 'L' as const, available: true };
    const query = filtersToQuery(test);
    const parsed = parseFilters(query);
    expect(parsed).toEqual(test);
    expect(filtersToQuery(parsed)).toBe(query);
  });
});

describe('@US5-FE2 filterArtworks - degradation mode', () => {
  it('US5-FE2 empty artworks array returns empty result', () => {
    const data = { categories: [], artworks: [] } as unknown as GalleryData;
    expect(filterArtworks(data, NO_FILTERS)).toEqual([]);
  });

  it('US5-FE2 null artworks is treated as empty', () => {
    const data = { categories: [], artworks: null } as unknown as GalleryData;
    expect(filterArtworks(data, NO_FILTERS)).toEqual([]);
  });

  it('US5-FE2 category filter with non-existent ID shows nothing', () => {
    const data = { categories: [], artworks: [mk(1, 1, 30, 30)] } as unknown as GalleryData;
    expect(filterArtworks(data, { ...NO_FILTERS, category: 999 })).toEqual([]);
  });

  it('US5-FE2 available filter shows only Available status', () => {
    const artworks = [
      mk(1, 1, 30, 30, 'Available'),
      mk(2, 1, 60, 50, 'Sold'),
      mk(3, 1, 100, 80, 'OnOrder'),
    ];
    const data = { categories: cats, artworks } as unknown as GalleryData;
    expect(ids(filterArtworks(data, { ...NO_FILTERS, available: true }))).toEqual([1]);
  });

  it('US5-FE2 size filter with no matching works returns empty', () => {
    const data = { categories: [], artworks: [mk(1, 1, null, null)] } as unknown as GalleryData;
    expect(filterArtworks(data, { ...NO_FILTERS, size: 'S' })).toEqual([]);
  });

  it('US5-FE2 combining all three filters (category + size + available)', () => {
    const artworks = [
      mk(1, 1, 30, 30, 'Available'),
      mk(2, 1, 60, 50, 'Available'),
      mk(3, 1, 100, 80, 'Sold'),
      mk(4, 2, 60, 50, 'Available'),
    ];
    const data = { categories: cats, artworks } as unknown as GalleryData;
    const result = filterArtworks(data, { category: 1, size: 'M', available: true });
    expect(ids(result)).toEqual([2]);
  });

  it('US5-FE2 size filter S matches boundaries correctly', () => {
    const artworks = [
      mk(1, 1, 30, 30),
      mk(2, 1, 40, 40),
      mk(3, 1, 41, 41),
    ];
    const data = { categories: cats, artworks } as unknown as GalleryData;
    expect(ids(filterArtworks(data, { ...NO_FILTERS, size: 'S' }))).toEqual([1, 2]);
  });

  it('US5-FE2 size filter M matches boundaries correctly', () => {
    const artworks = [
      mk(1, 1, 40, 40),
      mk(2, 1, 60, 50),
      mk(3, 1, 80, 80),
      mk(4, 1, 81, 81),
    ];
    const data = { categories: cats, artworks } as unknown as GalleryData;
    expect(ids(filterArtworks(data, { ...NO_FILTERS, size: 'M' }))).toEqual([2, 3]);
  });

  it('US5-FE2 works with only one dimension are excluded from all size filters', () => {
    const artworks = [
      mk(1, 1, 60, null),
      mk(2, 1, null, 60),
      mk(3, 1, 60, 50),
    ];
    const data = { categories: cats, artworks } as unknown as GalleryData;
    expect(ids(filterArtworks(data, { ...NO_FILTERS, size: 'M' }))).toEqual([3]);
  });
});

describe('@US5-AS2 artworksForSale and defaultCatalogue - degradation mode', () => {
  it('US5-AS2 artworksForSale handles empty array', () => {
    expect(artworksForSale({ categories: [], artworks: [] } as unknown as GalleryData)).toEqual([]);
  });

  it('US5-AS2 defaultCatalogue filters out both Sukhorukikh and exhibition photos', () => {
    const artworks = [
      mk(1, 1, 30, 30),
      mk(2, 2, 30, 30),
      mk(3, 4, 30, 30),
    ];
    const data = { categories: cats, artworks } as unknown as GalleryData;
    expect(ids(defaultCatalogue(data))).toEqual([1]);
  });

  it('US5-AS2 defaultCatalogue when all are special categories', () => {
    const artworks = [
      mk(1, 2, 30, 30),
      mk(2, 4, 30, 30),
    ];
    const data = { categories: cats, artworks } as unknown as GalleryData;
    expect(ids(defaultCatalogue(data))).toEqual([]);
  });

  it('US5-AS2 artworksForSale with multiple categories', () => {
    const artworks = [
      { ...mk(1, 1, 30, 30), category: cats[0] },
      { ...mk(2, 4, 30, 30), category: cats[2] },
    ];
    const data = { categories: cats, artworks } as unknown as GalleryData;
    expect(ids(artworksForSale(data))).toEqual([1]);
  });
});

describe('@US5-AS1 isAvailable predicate - degradation mode', () => {
  it('US5-AS1 identifies Available status exactly', () => {
    const work = { id: 1, status: 'Available' };
    expect(isAvailable(work)).toBe(true);
  });

  it('US5-AS1 rejects other statuses', () => {
    expect(isAvailable({ status: 'Sold' })).toBe(false);
    expect(isAvailable({ status: 'OnOrder' })).toBe(false);
    expect(isAvailable({ status: 'available' })).toBe(false);
  });

  it('US5-AS1 handles missing status', () => {
    expect(isAvailable({})).toBe(false);
    expect(isAvailable({ status: null })).toBe(false);
    expect(isAvailable({ status: undefined })).toBe(false);
  });
});
