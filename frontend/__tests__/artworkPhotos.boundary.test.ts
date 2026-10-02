import { getArtworkPhotos } from '@/lib/artworkPhotos';

describe('@US1-S3 artworkPhotos boundary cases', () => {
  it('returns fallback when images array is empty', () => {
    const artwork = {
      imagePath: '/cover.jpg',
      thumbnailPath: '/thumb-cover.jpg',
      images: []
    };
    const photos = getArtworkPhotos(artwork);
    expect(photos).toHaveLength(1);
    expect(photos[0]).toEqual({ path: '/cover.jpg', thumbPath: '/thumb-cover.jpg' });
  });

  it('returns fallback when images is undefined', () => {
    const artwork = {
      imagePath: '/cover.jpg',
      thumbnailPath: '/thumb-cover.jpg',
      images: undefined
    };
    const photos = getArtworkPhotos(artwork);
    expect(photos).toHaveLength(1);
    expect(photos[0]).toEqual({ path: '/cover.jpg', thumbPath: '/thumb-cover.jpg' });
  });

  it('uses imagePath as fallback for missing thumbnailPath in legacy data', () => {
    const artwork = {
      imagePath: '/cover.jpg',
      images: []
    };
    const photos = getArtworkPhotos(artwork);
    expect(photos[0].thumbPath).toBe('/cover.jpg');
  });

  it('sorts images by sortOrder when unordered', () => {
    const artwork = {
      imagePath: '/cover.jpg',
      images: [
        { id: 1, imagePath: '/photo-2.jpg', thumbnailPath: '/thumb-2.jpg', sortOrder: 2 },
        { id: 2, imagePath: '/photo-0.jpg', thumbnailPath: '/thumb-0.jpg', sortOrder: 0 },
        { id: 3, imagePath: '/photo-1.jpg', thumbnailPath: '/thumb-1.jpg', sortOrder: 1 }
      ]
    };
    const photos = getArtworkPhotos(artwork);
    expect(photos).toHaveLength(3);
    expect(photos[0].path).toBe('/photo-0.jpg');
    expect(photos[1].path).toBe('/photo-1.jpg');
    expect(photos[2].path).toBe('/photo-2.jpg');
  });

  it('preserves order when images already sorted', () => {
    const artwork = {
      imagePath: '/cover.jpg',
      images: [
        { id: 1, imagePath: '/a.jpg', thumbnailPath: '/ta.jpg', sortOrder: 0 },
        { id: 2, imagePath: '/b.jpg', thumbnailPath: '/tb.jpg', sortOrder: 1 }
      ]
    };
    const photos = getArtworkPhotos(artwork);
    expect(photos.map(p => p.path)).toEqual(['/a.jpg', '/b.jpg']);
  });

  it('handles single image in array', () => {
    const artwork = {
      imagePath: '/cover.jpg',
      images: [
        { id: 1, imagePath: '/single.jpg', thumbnailPath: '/thumb-single.jpg', sortOrder: 0 }
      ]
    };
    const photos = getArtworkPhotos(artwork);
    expect(photos).toHaveLength(1);
    expect(photos[0].path).toBe('/single.jpg');
  });

  it('uses image thumbnailPath over fallback when available', () => {
    const artwork = {
      imagePath: '/cover.jpg',
      images: [
        { id: 1, imagePath: '/photo.jpg', thumbnailPath: '/thumb-photo.jpg', sortOrder: 0 }
      ]
    };
    const photos = getArtworkPhotos(artwork);
    expect(photos[0].thumbPath).toBe('/thumb-photo.jpg');
  });

  it('falls back to imagePath when image thumbnailPath is missing', () => {
    const artwork: any = {
      imagePath: '/cover.jpg',
      images: [
        { id: 1, imagePath: '/photo.jpg', sortOrder: 0 }
      ]
    };
    const photos = getArtworkPhotos(artwork);
    expect(photos[0].thumbPath).toBe('/photo.jpg');
  });

  it('handles large number of images with varied sortOrder', () => {
    const images: Array<{ id: number; imagePath: string; thumbnailPath: string; sortOrder: number }> = Array.from(
      { length: 20 },
      (_, i) => ({
        id: i,
        imagePath: `/photo-${i}.jpg`,
        thumbnailPath: `/thumb-${i}.jpg`,
        sortOrder: Math.floor(Math.random() * 20)
      })
    );
    const artwork = { imagePath: '/cover.jpg', images };
    const photos = getArtworkPhotos(artwork);
    expect(photos).toHaveLength(20);
    // Verify sorting is stable (sortOrder increases or stays same)
    for (let i = 1; i < photos.length; i++) {
      const prevOrder = images.find(img => img.imagePath === photos[i - 1].path)!.sortOrder;
      const currOrder = images.find(img => img.imagePath === photos[i].path)!.sortOrder;
      expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
    }
  });

  it('does not mutate input array', () => {
    const imageArray = [
      { id: 2, imagePath: '/photo-1.jpg', thumbnailPath: '/thumb-1.jpg', sortOrder: 1 },
      { id: 1, imagePath: '/photo-0.jpg', thumbnailPath: '/thumb-0.jpg', sortOrder: 0 }
    ];
    const artwork = { imagePath: '/cover.jpg', images: imageArray };
    const originalOrder = imageArray.map(i => i.sortOrder);
    getArtworkPhotos(artwork);
    // Verify original array wasn't modified
    expect(imageArray.map(i => i.sortOrder)).toEqual(originalOrder);
  });
});
