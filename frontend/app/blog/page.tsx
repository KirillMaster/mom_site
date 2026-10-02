import type { Metadata } from 'next';
import { getBlogCategories, getBlogList } from '@/lib/blogApi';
import { parseBlogPage } from '@/lib/blogPage';
import BlogList from '@/components/blog/BlogList';
import { buildBlogListMetadata, SITE_URL } from '@/lib/blogSeo';

export const revalidate = 300;

interface BlogPageProps {
  searchParams: { page?: string | string[] };
}

export const metadata: Metadata = buildBlogListMetadata(
  'Блог — Анжела Моисеенко',
  'Новости, выставки и рассказы о картинах художника Анжелы Моисеенко.',
  `${SITE_URL}/blog`,
);

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const [data, categories] = await Promise.all([getBlogList(parseBlogPage(searchParams.page)), getBlogCategories()]);
  const empty = { items: [], total: 0, page: 1, pageSize: 12 };
  return <BlogList title="Блог" data={data ?? empty} categories={categories} basePath="/blog" />;
}
