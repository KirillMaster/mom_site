import { GalleryData } from '@/lib/api';

// "Фото с выставок" is a photo report from openings, not work for sale. It has
// its own filter button, but it must stay out of the default catalogue — both
// the visible one and the structured data — or 141 snapshots bury the paintings.
// Matched by name rather than id: the id is a database detail that differs
// between environments.
export const EXHIBITION_PHOTOS_CATEGORY_NAME = 'Фото с выставок';

const normalize = (name?: string | null) => (name || '').trim().toLowerCase();

type Categories = GalleryData['categories'];

const categoryNameOf = (artwork: any, categories: Categories) =>
  artwork.category?.name ?? categories?.find((category) => category.id === artwork.categoryId)?.name;

export const isExhibitionPhoto = (artwork: any, categories: Categories) =>
  normalize(categoryNameOf(artwork, categories)) === normalize(EXHIBITION_PHOTOS_CATEGORY_NAME);

export const artworksForSale = (galleryData: GalleryData) =>
  (galleryData.artworks || []).filter((artwork) => !isExhibitionPhoto(artwork, galleryData.categories));

// Landscapes by Vsevolod Sukhorukikh are another author's work: shown in their
// own tab with an attribution, never mixed into the default catalogue.
export const SUKHORUKIKH_CATEGORY_NAME = 'Пейзажи Всеволода Сухоруких';

export const isSukhorukikh = (artwork: any, categories: Categories) =>
  normalize(categoryNameOf(artwork, categories)) === normalize(SUKHORUKIKH_CATEGORY_NAME);

export const sukhorukikhCategory = (categories?: Categories) =>
  categories?.find((category) => normalize(category.name) === normalize(SUKHORUKIKH_CATEGORY_NAME));

export const defaultCatalogue = (galleryData: GalleryData) =>
  (galleryData.artworks || []).filter(
    (artwork) =>
      !isExhibitionPhoto(artwork, galleryData.categories) && !isSukhorukikh(artwork, galleryData.categories)
  );

export type SizeClass = 'S' | 'M' | 'L';
export const SIZE_CLASSES: SizeClass[] = ['S', 'M', 'L'];

export const sizeClass = (width?: number | null, height?: number | null): SizeClass | null => {
  if (!width || !height || width <= 0 || height <= 0) return null;
  const longest = Math.max(width, height);
  if (longest <= 40) return 'S';
  if (longest <= 80) return 'M';
  return 'L';
};

export interface CatalogueFilters {
  category: number | null;
  size: SizeClass | null;
  available: boolean;
}

export const NO_FILTERS: CatalogueFilters = { category: null, size: null, available: false };

export const isAvailable = (artwork: any) => artwork.status === 'Available';

export const filterArtworks = (galleryData: GalleryData, filters: CatalogueFilters) => {
  const base = filters.category
    ? (galleryData.artworks || []).filter((artwork) => artwork.categoryId === filters.category)
    : defaultCatalogue(galleryData);
  return base.filter(
    (artwork) =>
      (!filters.size || sizeClass(artwork.widthCm, artwork.heightCm) === filters.size) &&
      (!filters.available || isAvailable(artwork))
  );
};

export const parseFilters = (search: string): CatalogueFilters => {
  const params = new URLSearchParams(search);
  const rawCategory = Number(params.get('category'));
  const size = params.get('size');
  return {
    category: Number.isInteger(rawCategory) && rawCategory > 0 ? rawCategory : null,
    size: SIZE_CLASSES.includes(size as SizeClass) ? (size as SizeClass) : null,
    available: params.get('available') === '1',
  };
};

export const filtersToQuery = (filters: CatalogueFilters): string => {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', String(filters.category));
  if (filters.size) params.set('size', filters.size);
  if (filters.available) params.set('available', '1');
  const query = params.toString();
  return query ? `?${query}` : '';
};
