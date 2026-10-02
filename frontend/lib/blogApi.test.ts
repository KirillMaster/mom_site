import { api } from './api';
import { adminBlog, blogErrorMessage, getBlogList, getBlogPost, uploadBlogImage } from './blogApi';

jest.mock('./api', () => ({
  API_BASE_URL: 'http://api.test',
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('blogApi', () => {
  beforeEach(() => jest.resetAllMocks());

  it('uploadBlogImage sends multipart to /admin/blog/images and reports progress', async () => {
    mockedApi.post.mockResolvedValue({ data: { url: 'https://s3/blog/1.jpg' } });
    const onProgress = jest.fn();
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    const url = await uploadBlogImage(file, onProgress);

    expect(url).toBe('https://s3/blog/1.jpg');
    const [path, body, config] = mockedApi.post.mock.calls[0];
    expect(path).toBe('/admin/blog/images');
    expect((body as FormData).get('file')).toBe(file);
    config!.onUploadProgress!({ loaded: 50, total: 100 } as never);
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('admin update uses PUT with id', async () => {
    mockedApi.put.mockResolvedValue({ data: { id: 3 } });
    await adminBlog.update(3, { title: 't', slug: 's', bodyHtml: '<p>x</p>' });
    expect(mockedApi.put).toHaveBeenCalledWith('/admin/blog/3', expect.objectContaining({ title: 't' }));
  });

  it('getBlogList builds query and caches for 5 minutes', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [], total: 0 }) });
    global.fetch = fetchMock as never;

    await getBlogList(2, 'masterskaya');

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/public/blog?page=2&categorySlug=masterskaya');
    expect(fetchMock.mock.calls[0][1].next.revalidate).toBe(300);
  });

  it('getBlogPost returns null on 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as never;
    expect(await getBlogPost('net-takoy')).toBeNull();
  });

  it('blogErrorMessage prefers server message, then first field error', () => {
    expect(blogErrorMessage({ response: { data: { message: 'Файл большой' } } })).toBe('Файл большой');
    expect(blogErrorMessage({ response: { data: { errors: { title: 'Напишите заголовок.' } } } })).toBe('Напишите заголовок.');
    expect(blogErrorMessage(new Error('x'))).toContain('Не получилось');
  });
});
