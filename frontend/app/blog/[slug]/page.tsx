import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/hooks/useApi';
import { getBlogPost } from '@/lib/blogApi';
import { formatBlogDate } from '@/lib/blogFormat';
import ArticleBody from '@/components/blog/ArticleBody';
import RelatedArtworks from '@/components/blog/RelatedArtworks';
import BlogCta from '@/components/blog/BlogCta';
import BlogPostJsonLd from '@/components/blog/BlogPostJsonLd';
import { buildBlogPostMetadata } from '@/lib/blogSeo';

export const revalidate = 300;

interface BlogPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const data = await getBlogPost(params.slug);
    return data ? buildBlogPostMetadata(data.post, getImageUrl) : {};
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const data = await getBlogPost(params.slug);
  if (!data) notFound();
  const { post, artworks } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogPostJsonLd post={post} />
      <article className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        <nav aria-label="breadcrumbs" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary-600">Главная</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog" className="hover:text-primary-600">Блог</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/blog/category/${post.category.slug}`} className="hover:text-primary-600">
            {post.category.name}
          </Link>
        </nav>

        {post.coverImagePath && (
          <img
            src={getImageUrl(post.coverImagePath)}
            alt={post.coverAlt || post.title}
            fetchPriority="high"
            className="mb-8 w-full rounded-2xl object-cover"
          />
        )}

        <h1 className="font-serif text-3xl font-bold text-gray-900 md:text-4xl">{post.title}</h1>
        <p className="mt-3 mb-8 text-sm text-gray-500">
          <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
          {' · '}{post.readingMinutes} мин чтения
        </p>

        <ArticleBody html={post.bodyHtml} />
        <RelatedArtworks artworks={artworks} />
        <BlogCta slug={post.slug} />
      </article>
    </div>
  );
}
