import { slugifyTitle } from './artworkSlug';
import type { BlogPostAdmin, BlogPostSave, BlogStatus } from '../types/blog';

export interface PostForm {
  title: string;
  slug: string;
  slugTouched: boolean;
  bodyHtml: string;
  excerpt: string;
  coverImagePath: string;
  coverAlt: string;
  seoTitle: string;
  seoDescription: string;
  blogCategoryId: number | null;
  artworkIds: number[];
  publishedAt: string | null;
}

export const EMPTY_POST_FORM: PostForm = {
  title: '', slug: '', slugTouched: false, bodyHtml: '', excerpt: '', coverImagePath: '', coverAlt: '',
  seoTitle: '', seoDescription: '', blogCategoryId: null, artworkIds: [], publishedAt: null,
};

export const STATUS_LABELS: Record<BlogStatus, string> = {
  Draft: 'Черновик',
  Scheduled: 'Запланировано',
  Published: 'Опубликовано',
};

export function blogSlug(title: string): string {
  if (!title.trim()) return '';
  const slug = slugifyTitle(title).slice(0, 80).replace(/-+$/, '');
  return slug === 'artwork' ? 'novost' : slug;
}

export function statusAt(publishedAt: string | null, now = new Date()): BlogStatus {
  if (!publishedAt) return 'Draft';
  return new Date(publishedAt) > now ? 'Scheduled' : 'Published';
}

export function withTitle(form: PostForm, title: string, locked: boolean): PostForm {
  const slug = form.slugTouched || locked ? form.slug : blogSlug(title);
  return { ...form, title, slug };
}

export function fromAdmin(post: BlogPostAdmin): PostForm {
  return {
    title: post.title, slug: post.slug, slugTouched: true, bodyHtml: post.bodyHtml, excerpt: post.excerpt ?? '',
    coverImagePath: post.cover.imagePath ?? '', coverAlt: post.cover.alt ?? '',
    seoTitle: post.seo.title ?? '', seoDescription: post.seo.description ?? '',
    blogCategoryId: post.blogCategoryId, artworkIds: post.artworkIds, publishedAt: post.publishedAt ?? null,
  };
}

const orNull = (value: string) => (value.trim() ? value.trim() : null);

export function toSave(form: PostForm, publishedAt: string | null): BlogPostSave {
  return {
    title: form.title.trim(),
    slug: form.slug || blogSlug(form.title),
    bodyHtml: form.bodyHtml,
    excerpt: orNull(form.excerpt),
    cover: { imagePath: orNull(form.coverImagePath), alt: orNull(form.coverAlt) },
    seo: { title: orNull(form.seoTitle), description: orNull(form.seoDescription) },
    blogCategoryId: form.blogCategoryId,
    artworkIds: form.artworkIds,
    publishedAt,
  };
}

/** Мягкие подсказки перед публикацией — не блокируют. */
export function publishHints(form: PostForm): string[] {
  const hints: string[] = [];
  if (!form.coverImagePath) hints.push('Нет обложки — в списке новостей будет просто текст без картинки.');
  if (!form.excerpt.trim()) hints.push('Нет анонса — возьмём первые строки текста.');
  return hints;
}

/** Ошибки, без которых сохранить нельзя. */
export function requiredErrors(form: PostForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = 'Напишите заголовок.';
  if (!form.bodyHtml.trim()) errors.bodyHtml = 'Напишите текст новости.';
  return errors;
}

export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
