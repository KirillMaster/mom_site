import { render } from '@testing-library/react';
import BlogPostJsonLd from './BlogPostJsonLd';
import { ARTIST_ID, buildBlogPostMetadata } from '@/lib/blogSeo';
import type { BlogPost } from '@/types/blog';

const post: BlogPost = {
  slug: 'vystavka',
  title: 'Выставка в Твери',
  excerpt: 'Коротко о выставке',
  coverImagePath: 'https://s3/cover.jpg',
  coverAlt: 'Зал',
  category: { slug: 'novosti', name: 'Новости' },
  publishedAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-02T10:00:00Z',
  readingMinutes: 3,
  bodyHtml: '<p>Текст</p>',
  seoTitle: null,
  seoDescription: null,
};

const schemas = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map((s) => JSON.parse(s.innerHTML));

describe('BlogPostJsonLd', () => {
  it('renders valid BlogPosting and BreadcrumbList', () => {
    const { container } = render(<BlogPostJsonLd post={post} />);
    const [article, breadcrumbs] = schemas(container);
    expect(article['@type']).toBe('BlogPosting');
    expect(article.headline).toBe(post.title);
    expect(article.datePublished).toBe(post.publishedAt);
    expect(article.dateModified).toBe(post.updatedAt);
    expect(article.author).toEqual({ '@id': ARTIST_ID });
    expect(article.mainEntityOfPage).toBe('https://angelamoiseenko.ru/blog/vystavka');
    expect(article.image).toBe('https://s3/cover.jpg');
    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
    expect(breadcrumbs.itemListElement.map((i: any) => i.name)).toEqual(['Главная', 'Блог', 'Новости', post.title]);
  });

  it('escapes "<" so the body cannot close the script tag', () => {
    const { container } = render(<BlogPostJsonLd post={{ ...post, title: '</script><b>x' }} />);
    expect(container.querySelector('script')!.innerHTML).not.toContain('</script>');
    expect(schemas(container)[0].headline).toBe('</script><b>x');
  });
});

describe('buildBlogPostMetadata', () => {
  const url = (path: string) => path;

  it('falls back to Title and Excerpt without SEO fields', () => {
    const meta = buildBlogPostMetadata(post, url);
    expect(meta.title).toBe(post.title);
    expect(meta.description).toBe(post.excerpt);
    expect(meta.alternates?.canonical).toBe('https://angelamoiseenko.ru/blog/vystavka');
    expect((meta.openGraph as any).type).toBe('article');
  });

  it('prefers SEO title and description', () => {
    const meta = buildBlogPostMetadata({ ...post, seoTitle: 'SEO', seoDescription: 'Описание' }, url);
    expect(meta.title).toBe('SEO');
    expect(meta.description).toBe('Описание');
  });
});
