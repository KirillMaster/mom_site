'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PenLine, Trash2 } from 'lucide-react';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import type { BlogPostAdminListItem } from '@/types/blog';
import { adminBlog, blogErrorMessage } from '@/lib/blogApi';
import { STATUS_LABELS } from '@/lib/blogForm';

const STATUS_STYLES = {
  Draft: 'bg-gray-100 text-gray-700',
  Scheduled: 'bg-blue-100 text-blue-800',
  Published: 'bg-green-100 text-green-800',
} as const;

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const BlogListContent = () => {
  const [posts, setPosts] = useState<BlogPostAdminListItem[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminBlog.list().then(setPosts).catch((e) => setError(blogErrorMessage(e, 'Не получилось загрузить новости.')));
  }, []);

  const remove = async (post: BlogPostAdminListItem) => {
    if (!window.confirm(`Удалить новость «${post.title}»? Это нельзя отменить.`)) return;
    try {
      await adminBlog.remove(post.id);
      setPosts((list) => list?.filter((p) => p.id !== post.id) ?? null);
    } catch (e) {
      setError(blogErrorMessage(e, 'Не получилось удалить новость.'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Блог / Новости</h1>
        <Link href="/admin/blog/new" className="btn-primary min-h-[44px] inline-flex items-center gap-2">
          <PenLine size={18} /> Написать новость
        </Link>
      </div>
      <Link href="/admin" className="text-amber-700 inline-block">← В админку</Link>

      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!posts && !error && <p className="text-gray-500">Загружаем…</p>}
      {posts?.length === 0 && (
        <p className="card bg-white p-6 text-gray-600">Новостей пока нет. Нажмите «Написать новость».</p>
      )}

      <ul className="space-y-2">
        {posts?.map((post) => (
          <li key={post.id} className="card bg-white p-4 flex items-center gap-3">
            <Link href={`/admin/blog/${post.id}`} className="flex-1 min-w-0">
              <span className="block font-medium truncate">{post.title}</span>
              <span className="text-sm text-gray-500">
                {post.categoryName} · {formatDate(post.publishedAt ?? post.updatedAt)}
              </span>
            </Link>
            <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${STATUS_STYLES[post.status]}`}>
              {STATUS_LABELS[post.status]}
            </span>
            <button
              type="button"
              aria-label={`Удалить «${post.title}»`}
              className="btn-secondary min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              onClick={() => remove(post)}
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const BlogAdminPage = () => (
  <AdminAuthGuard>
    <div className="min-h-screen bg-gray-50 p-3 sm:p-8">
      <BlogListContent />
    </div>
  </AdminAuthGuard>
);

export default BlogAdminPage;
