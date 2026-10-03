import { slimGalleryData } from '@/lib/gallery';
import type { GalleryData } from '@/lib/api';

const image = (id: number) => ({ id, imagePath: `https://s3/full-${id}.jpg`, thumbnailPath: `https://s3/thumb-${id}.jpg`, sortOrder: id });

const data = {
  bannerTitle: 'Галерея',
  bannerDescription: 'Работы',
  categories: [{ id: 2, name: 'Натюрморты', description: 'Классические', displayOrder: 2, isActive: true }],
  artworks: [
    {
      id: 7, title: '«Пионы»', description: 'Длинное описание работы', shortDescription: 'кратко',
      imagePath: 'https://s3/full-7.jpg', thumbnailPath: 'https://s3/thumb-7.jpg',
      price: 30000, isForSale: true, status: 'Available', widthCm: 60, heightCm: 50, year: 2025,
      support: 'холст', technique: 'масло', isFeatured: true,
      createdAt: '2026-01-01', updatedAt: '2026-01-02', categoryId: 2,
      category: { id: 2, name: 'Натюрморты', description: 'Классические', displayOrder: 2, isActive: true },
      images: [image(1), image(2), image(3)],
    },
  ],
} as unknown as GalleryData;

describe('slimGalleryData — the gallery ships only what a card and the filters read', () => {
  const slim = slimGalleryData(data);
  const artwork = slim.artworks[0] as unknown as Record<string, unknown>;

  it('keeps everything the card, museum label and filters use', () => {
    expect(artwork).toMatchObject({
      id: 7, title: '«Пионы»', thumbnailPath: 'https://s3/thumb-7.jpg', price: 30000, isForSale: true,
      status: 'Available', widthCm: 60, heightCm: 50, year: 2025, support: 'холст', technique: 'масло', categoryId: 2,
    });
    expect(artwork.category).toEqual({ id: 2, name: 'Натюрморты' });
  });

  it('keeps the photo count but drops image urls', () => {
    expect(slim.artworks[0].images).toHaveLength(3);
    expect(JSON.stringify(slim.artworks[0].images)).not.toContain('s3');
  });

  it('drops descriptions, full image and timestamps', () => {
    for (const key of ['description', 'shortDescription', 'imagePath', 'createdAt', 'updatedAt', 'isFeatured']) {
      expect(artwork).not.toHaveProperty(key);
    }
  });

  it('keeps categories and banner text untouched', () => {
    expect(slim.categories).toBe(data.categories);
    expect(slim.bannerTitle).toBe('Галерея');
    expect(slim.bannerDescription).toBe('Работы');
  });

  it('tolerates a missing artwork list and missing images', () => {
    expect(slimGalleryData({ categories: [] } as unknown as GalleryData).artworks).toEqual([]);
    const noImages = { ...data, artworks: [{ ...data.artworks[0], images: undefined, category: undefined }] } as unknown as GalleryData;
    const [only] = slimGalleryData(noImages).artworks;
    expect(only.images).toEqual([]);
    expect(only).not.toHaveProperty('category');
  });
});
