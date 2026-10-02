import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PostEditor from './PostEditor';
import { adminBlog } from '@/lib/blogApi';
import { blogSlug, publishHints, EMPTY_POST_FORM } from '@/lib/blogForm';
import type { BlogPostAdmin } from '@/types/blog';

const replace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
jest.mock('next/dynamic', () => () => {
  const Stub = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Текст новости" value={value} onChange={(e) => onChange(e.target.value)} />
  );
  return Stub;
});
jest.mock('@/hooks/useApi', () => ({ useArtworks: () => ({ data: [], isLoading: false }) }));
jest.mock('@/lib/blogApi', () => ({
  adminBlog: { categories: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn() },
  uploadBlogImage: jest.fn(),
  blogErrorMessage: (_e: unknown, fallback = 'Не получилось сохранить. Попробуйте ещё раз.') => fallback,
}));

const api = adminBlog as jest.Mocked<typeof adminBlog>;

const saved = (over: Partial<BlogPostAdmin> = {}): BlogPostAdmin => ({
  id: 7, title: 'Выставка', slug: 'vystavka', status: 'Published', publishedAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z', blogCategoryId: 1, categoryName: 'Новости', bodyHtml: '<p>Текст</p>',
  excerpt: null, cover: {}, seo: {}, artworkIds: [], ...over,
} as BlogPostAdmin);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  api.categories.mockResolvedValue([]);
});

const fillNew = () => {
  fireEvent.change(screen.getByLabelText('Заголовок'), { target: { value: 'Выставка в Москве' } });
  fireEvent.change(screen.getByLabelText('Текст новости'), { target: { value: '<p>Приглашаю</p>' } });
};

describe('PostEditor', () => {
  it('publishes a new post after the soft checklist with default category and slug from title', async () => {
    api.create.mockResolvedValue(saved());
    render(<PostEditor postId={null} />);
    fillNew();

    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }));
    expect(screen.getByRole('dialog', { name: 'Проверка перед публикацией' })).toHaveTextContent('Нет обложки');
    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать всё равно' }));

    await waitFor(() => expect(api.create).toHaveBeenCalled());
    const body = api.create.mock.calls[0][0];
    expect(body.blogCategoryId).toBeNull();
    expect(body.slug).toBe(blogSlug('Выставка в Москве'));
    expect(body.publishedAt).toEqual(expect.any(String));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/blog/7'));
  });

  it('saves a draft without publishedAt', async () => {
    api.create.mockResolvedValue(saved({ status: 'Draft', publishedAt: null }));
    render(<PostEditor postId={null} />);
    fillNew();
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить черновик' }));
    await waitFor(() => expect(api.create).toHaveBeenCalled());
    expect(api.create.mock.calls[0][0].publishedAt).toBeNull();
  });

  it('requires title and text before saving', () => {
    render(<PostEditor postId={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить черновик' }));
    expect(screen.getByText('Напишите заголовок.')).toBeInTheDocument();
    expect(screen.getByText('Напишите текст новости.')).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('locks the address of a published post and shows backend field errors', async () => {
    api.get.mockResolvedValue(saved());
    api.update.mockRejectedValue({ response: { status: 400, data: { errors: { excerpt: 'Анонс длиннее 300 символов.' } } } });
    render(<PostEditor postId={7} />);

    expect(await screen.findByLabelText('Адрес страницы')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByText('Анонс длиннее 300 символов.')).toBeInTheDocument();
  });

  it('offers to restore an unsaved local draft', () => {
    localStorage.setItem('blog-draft:new', JSON.stringify({ ...EMPTY_POST_FORM, title: 'Недописанное' }));
    render(<PostEditor postId={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Восстановить' }));
    expect(screen.getByLabelText('Заголовок')).toHaveValue('Недописанное');
  });
});

describe('blogForm', () => {
  it('falls back for titles without latin/cyrillic letters', () => {
    expect(blogSlug('!!!')).toBe('novost');
    expect(blogSlug('')).toBe('');
  });

  it('gives no hints when cover and excerpt are present', () => {
    expect(publishHints({ ...EMPTY_POST_FORM, coverImagePath: 'x', excerpt: 'y' })).toEqual([]);
  });
});
