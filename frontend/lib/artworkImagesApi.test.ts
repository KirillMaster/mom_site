import { api } from '@/lib/api';
import { deleteArtworkImage, reorderArtworkImages, uploadArtworkImages } from '@/lib/artworkImagesApi';

jest.mock('@/lib/api', () => ({
  api: { post: jest.fn(), delete: jest.fn(), put: jest.fn() },
}));

const mocked = api as unknown as { post: jest.Mock; delete: jest.Mock; put: jest.Mock };
const images = [{ id: 1, imagePath: '/a.jpg', thumbnailPath: '/t/a.jpg', sortOrder: 0 }];

describe('@US1-FE1 artwork images api client', () => {
  beforeEach(() => jest.clearAllMocks());

  it('US1-FE1 uploads files as multipart under the Images key and returns typed images', async () => {
    mocked.post.mockResolvedValue({ data: { images } });
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

    const result = await uploadArtworkImages(5, [file]);

    const [url, body] = mocked.post.mock.calls[0];
    expect(url).toBe('/admin/artworks/5/images');
    expect((body as FormData).getAll('Images')).toEqual([file]);
    expect(result).toEqual(images);
  });

  it('US1-FE1 deletes one image by id', async () => {
    mocked.delete.mockResolvedValue({ data: { images } });

    const result = await deleteArtworkImage(5, 9);

    expect(mocked.delete).toHaveBeenCalledWith('/admin/artworks/5/images/9');
    expect(result).toEqual(images);
  });

  it('US1-FE1 sends the new order as imageIds', async () => {
    mocked.put.mockResolvedValue({ data: { images } });

    const result = await reorderArtworkImages(5, [3, 1, 2]);

    expect(mocked.put).toHaveBeenCalledWith('/admin/artworks/5/images/order', { imageIds: [3, 1, 2] });
    expect(result).toEqual(images);
  });
});
