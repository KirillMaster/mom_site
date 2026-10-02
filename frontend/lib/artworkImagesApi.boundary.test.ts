import { api } from '@/lib/api';
import { deleteArtworkImage, reorderArtworkImages, uploadArtworkImages } from '@/lib/artworkImagesApi';

jest.mock('@/lib/api', () => ({
  api: { post: jest.fn(), delete: jest.fn(), put: jest.fn() },
}));

const mocked = api as unknown as { post: jest.Mock; delete: jest.Mock; put: jest.Mock };

describe('@US1-FE1 artwork images api - boundary cases', () => {
  beforeEach(() => jest.clearAllMocks());

  it('@US1-BE5 uploadArtworkImages handles empty file list correctly', async () => {
    const images: unknown[] = [];
    mocked.post.mockResolvedValue({ data: { images } });

    const result = await uploadArtworkImages(5, []);

    const [url, body] = mocked.post.mock.calls[0];
    expect(url).toBe('/admin/artworks/5/images');
    expect((body as FormData).getAll('Images')).toEqual([]);
    expect(result).toEqual([]);
  });

  it('@US1-BE5 uploadArtworkImages handles single file', async () => {
    const images = [{ id: 1, imagePath: '/a.jpg', thumbnailPath: '/t/a.jpg', sortOrder: 0 }];
    mocked.post.mockResolvedValue({ data: { images } });
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

    const result = await uploadArtworkImages(5, [file]);

    const [, body] = mocked.post.mock.calls[0];
    expect((body as FormData).getAll('Images').length).toBe(1);
    expect(result.length).toBe(1);
  });

  it('@US1-BE5 uploadArtworkImages handles multiple files in order', async () => {
    const images = [
      { id: 1, imagePath: '/a.jpg', thumbnailPath: '/t/a.jpg', sortOrder: 0 },
      { id: 2, imagePath: '/b.jpg', thumbnailPath: '/t/b.jpg', sortOrder: 1 },
      { id: 3, imagePath: '/c.jpg', thumbnailPath: '/t/c.jpg', sortOrder: 2 }
    ];
    mocked.post.mockResolvedValue({ data: { images } });
    const files = [
      new File(['1'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['2'], 'b.jpg', { type: 'image/jpeg' }),
      new File(['3'], 'c.jpg', { type: 'image/jpeg' })
    ];

    const result = await uploadArtworkImages(5, files);

    const [, body] = mocked.post.mock.calls[0];
    const formFiles = (body as FormData).getAll('Images') as File[];
    expect(formFiles.length).toBe(3);
    expect(result).toEqual(images);
    expect(result.map(i => i.sortOrder)).toEqual([0, 1, 2]);
  });

  it('@US1-BE2 reorderArtworkImages handles single image', async () => {
    const images = [{ id: 1, imagePath: '/a.jpg', thumbnailPath: '/t/a.jpg', sortOrder: 0 }];
    mocked.put.mockResolvedValue({ data: { images } });

    const result = await reorderArtworkImages(5, [1]);

    expect(mocked.put).toHaveBeenCalledWith('/admin/artworks/5/images/order', { imageIds: [1] });
    expect(result.length).toBe(1);
  });

  it('@US1-BE2 reorderArtworkImages handles empty order', async () => {
    mocked.put.mockResolvedValue({ data: { images: [] } });

    const result = await reorderArtworkImages(5, []);

    expect(mocked.put).toHaveBeenCalledWith('/admin/artworks/5/images/order', { imageIds: [] });
    expect(result).toEqual([]);
  });

  it('@US1-EC3 deleteArtworkImage handles deletion attempt on last image', async () => {
    const error = { response: { status: 400 } };
    mocked.delete.mockRejectedValue(error);

    await expect(deleteArtworkImage(5, 1)).rejects.toEqual(error);
    expect(mocked.delete).toHaveBeenCalledWith('/admin/artworks/5/images/1');
  });

  it('@US1-BE4 deleteArtworkImage returns remaining images with normalized sort order', async () => {
    const remainingImages = [
      { id: 2, imagePath: '/b.jpg', thumbnailPath: '/t/b.jpg', sortOrder: 0 },
      { id: 3, imagePath: '/c.jpg', thumbnailPath: '/t/c.jpg', sortOrder: 1 }
    ];
    mocked.delete.mockResolvedValue({ data: { images: remainingImages } });

    const result = await deleteArtworkImage(5, 1);

    expect(mocked.delete).toHaveBeenCalledWith('/admin/artworks/5/images/1');
    expect(result).toEqual(remainingImages);
    expect(result.map(i => i.sortOrder)).toEqual([0, 1]);
  });

  it('@US1-BE2 reorderArtworkImages preserves sort order in response', async () => {
    const images = [
      { id: 3, imagePath: '/c.jpg', thumbnailPath: '/t/c.jpg', sortOrder: 0 },
      { id: 1, imagePath: '/a.jpg', thumbnailPath: '/t/a.jpg', sortOrder: 1 },
      { id: 2, imagePath: '/b.jpg', thumbnailPath: '/t/b.jpg', sortOrder: 2 }
    ];
    mocked.put.mockResolvedValue({ data: { images } });

    const result = await reorderArtworkImages(5, [3, 1, 2]);

    expect(result).toEqual(images);
    for (let i = 0; i < result.length; i++) {
      expect(result[i].sortOrder).toBe(i);
    }
  });
});
