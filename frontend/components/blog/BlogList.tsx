import Link from 'next/link';
import type { BlogPostPage, BlogPublicCategory } from '@/types/blog';
import PostCard from './PostCard';
import Pagination from './Pagination';
import CategoryTabs from './CategoryTabs';

interface BlogListProps {
  title: string;
  description?: string | null;
  data: BlogPostPage;
  categories: BlogPublicCategory[];
  basePath: string;
  activeSlug?: string;
}

export default function BlogList({ title, description, data, categories, basePath, activeSlug }: BlogListProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <nav aria-label="breadcrumbs" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary-600">Главная</Link>
          <span aria-hidden="true">/</span>
          {activeSlug ? <Link href="/blog" className="hover:text-primary-600">Блог</Link> : <span>Блог</span>}
        </nav>
        <h1 className="mb-3 font-serif text-3xl font-bold text-gray-900 md:text-4xl">{title}</h1>
        {description && <p className="mb-6 max-w-3xl text-lg text-gray-600">{description}</p>}
        <CategoryTabs categories={categories} activeSlug={activeSlug} />
        {data.items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((post) => <PostCard key={post.slug} post={post} />)}
          </div>
        ) : (
          <p className="text-lg text-gray-600">Скоро здесь появятся новости.</p>
        )}
        <Pagination basePath={basePath} page={data.page} total={data.total} pageSize={data.pageSize} />
      </div>
    </div>
  );
}
