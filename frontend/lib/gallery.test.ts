import { artworksForSale, isExhibitionPhoto } from '@/lib/gallery';
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
