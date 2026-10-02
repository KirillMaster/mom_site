import type { Metadata } from 'next';
import type { BlogPost } from '../types/blog';

export const SITE_URL = 'https://angelamoiseenko.ru';
export const ARTIST_ID = `${SITE_URL}/#artist`;
const SITE_NAME = 'Анжела Моисеенко - Художник-импрессионист';

export const blogPostUrl = (slug: string) => `${SITE_URL}/blog/${slug}`;
export const blogCategoryUrl = (slug: string) => `${SITE_URL}/blog/category/${slug}`;

type ImageUrl = (path: string) => string;

export function buildBlogPostMetadata(post: BlogPost, imageUrl: ImageUrl): Metadata {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = blogPostUrl(post.slug);
  const images = post.coverImagePath ? [{ url: imageUrl(post.coverImagePath), alt: post.coverAlt || post.title }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'ru_RU',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      section: post.category.name,
      images,
    },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description },
  };
}

export function buildBlogListMetadata(title: string, description: string, url: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'ru_RU', type: 'website' },
  };
}

export function buildBlogPostSchemas(post: BlogPost, imageUrl: ImageUrl) {
  const url = blogPostUrl(post.slug);
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: url,
    url,
    articleSection: post.category.name,
    inLanguage: 'ru-RU',
    author: { '@id': ARTIST_ID },
    publisher: { '@id': ARTIST_ID },
  };
  if (post.coverImagePath) article.image = imageUrl(post.coverImagePath);

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Блог', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.category.name, item: blogCategoryUrl(post.category.slug) },
      { '@type': 'ListItem', position: 4, name: post.title, item: url },
    ],
  };
  return [article, breadcrumbs];
}
