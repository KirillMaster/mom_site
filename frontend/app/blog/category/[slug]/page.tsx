import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogCategories, getBlogList } from '@/lib/blogApi';
import { parseBlogPage } from '@/lib/blogPage';
import BlogList from '@/components/blog/BlogList';
import { blogCategoryUrl, buildBlogListMetadata } from '@/lib/blogSeo';

export const revalidate = 300;

interface BlogCategoryPageProps {
  params: { slug: string };
  searchParams: { page?: string | string[] };
}

export async function generateMetadata({ params }: BlogCategoryPageProps): Promise<Metadata> {
  try {
    const data = await getBlogList(1, params.slug);
    if (!data?.category) return {};
    const { name, slug, description } = data.category;
    return buildBlogListMetadata(
      `${name} — блог Анжелы Моисеенко`,
      description || `${name}: статьи и новости художника Анжелы Моисеенко.`,
      blogCategoryUrl(slug),
    );
  } catch {
    return {};
  }
}

export default async function BlogCategoryPage({ params, searchParams }: BlogCategoryPageProps) {
  const [data, categories] = await Promise.all([
    getBlogList(parseBlogPage(searchParams.page), params.slug),
    getBlogCategories(),
  ]);
  if (!data?.category) notFound();
  return (
    <BlogList
      title={data.category.name}
      description={data.category.description}
      data={data}
      categories={categories}
      basePath={`/blog/category/${data.category.slug}`}
      activeSlug={data.category.slug}
    />
  );
}
