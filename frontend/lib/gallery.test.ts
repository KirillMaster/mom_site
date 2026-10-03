import {
  artworksForSale, isExhibitionPhoto, sizeClass, filterArtworks, parseFilters, filtersToQuery, defaultCatalogue, NO_FILTERS,
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
