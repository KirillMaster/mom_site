import { api, API_BASE_URL } from './api';
import type {
  BlogCategory,
  BlogCategorySave,
  BlogPostAdmin,
  BlogPostAdminListItem,
  BlogPostPage,
  BlogPostSave,
  BlogPublicCategory,
  BlogPublicPost,
} from '../types/blog';

export const BLOG_REVALIDATE_SECONDS = 300;

async function getPublic<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}/public/blog${path}`, {
    next: { revalidate: BLOG_REVALIDATE_SECONDS, tags: ['blog'] },
  } as RequestInit);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Blog API ${response.status}`);
  return (await response.json()) as T;
}

export function getBlogList(page = 1, categorySlug?: string): Promise<BlogPostPage | null> {
  const params = new URLSearchParams({ page: String(page) });
  if (categorySlug) params.set('categorySlug', categorySlug);
  return getPublic<BlogPostPage>(`?${params.toString()}`);
}

export function getBlogPost(slug: string): Promise<BlogPublicPost | null> {
  return getPublic<BlogPublicPost>(`/${encodeURIComponent(slug)}`);
}

export async function getBlogCategories(): Promise<BlogPublicCategory[]> {
  return (await getPublic<BlogPublicCategory[]>('/categories')) ?? [];
}

export const adminBlog = {
  list: async () => (await api.get<BlogPostAdminListItem[]>('/admin/blog')).data,
  get: async (id: number) => (await api.get<BlogPostAdmin>(`/admin/blog/${id}`)).data,
  create: async (post: BlogPostSave) => (await api.post<BlogPostAdmin>('/admin/blog', post)).data,
  update: async (id: number, post: BlogPostSave) => (await api.put<BlogPostAdmin>(`/admin/blog/${id}`, post)).data,
  remove: async (id: number) => {
    await api.delete(`/admin/blog/${id}`);
  },
  categories: async () => (await api.get<BlogCategory[]>('/admin/blog/categories')).data,
  createCategory: async (category: BlogCategorySave) =>
    (await api.post<BlogCategory>('/admin/blog/categories', category)).data,
  updateCategory: async (id: number, category: BlogCategorySave) =>
    (await api.put<BlogCategory>(`/admin/blog/categories/${id}`, category)).data,
  removeCategory: async (id: number) => {
    await api.delete(`/admin/blog/categories/${id}`);
  },
};

export async function uploadBlogImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post<{ url: string }>('/admin/blog/images', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });
  return response.data.url;
}

export function blogErrorMessage(error: unknown, fallback = 'Не получилось сохранить. Попробуйте ещё раз.'): string {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string> } } })?.response?.data;
  if (data?.message) return data.message;
  const first = data?.errors && Object.values(data.errors)[0];
  return first || fallback;
}
