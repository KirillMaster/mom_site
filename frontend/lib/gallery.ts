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
