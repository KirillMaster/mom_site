import { render, screen } from '@testing-library/react';
import BlogList from './BlogList';
import { parseBlogPage } from '@/lib/blogPage';
import type { BlogPostListItem } from '@/types/blog';

const post = (n: number): BlogPostListItem => ({
  slug: `post-${n}`,
  title: `Статья ${n}`,
  excerpt: 'Анонс',
  category: { slug: 'vystavki', name: 'Выставки' },
  publishedAt: '2026-09-01T10:00:00Z',
  readingMinutes: 2,
});

const categories = [{ slug: 'vystavki', name: 'Выставки', postCount: 15 }];

describe('BlogList', () => {
  it('shows 3 cards on page 2 of 15 posts and links pages', () => {
    render(
      <BlogList
        title="Блог"
        data={{ items: [13, 14, 15].map(post), total: 15, page: 2, pageSize: 12 }}
        categories={categories}
        basePath="/blog"
      />,
    );
    expect(screen.getAllByTestId('post-card')).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('href', '/blog');
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
  });

  it('marks the active category and keeps it in page links', () => {
    render(
      <BlogList
        title="Выставки"
        description="Где посмотреть картины"
        data={{ items: [post(1)], total: 13, page: 1, pageSize: 12 }}
        categories={categories}
        basePath="/blog/category/vystavki"
        activeSlug="vystavki"
      />,
    );
    expect(screen.getByRole('link', { name: 'Выставки' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '/blog/category/vystavki?page=2');
    expect(screen.getByText('Где посмотреть картины')).toBeInTheDocument();
  });

  it('says news are coming when empty, without pagination', () => {
    render(<BlogList title="Блог" data={{ items: [], total: 0, page: 1, pageSize: 12 }} categories={[]} basePath="/blog" />);
    expect(screen.getByText('Скоро здесь появятся новости.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Страницы блога' })).toBeNull();
  });
});

describe('parseBlogPage', () => {
  it.each([[undefined, 1], ['2', 2], ['0', 1], ['abc', 1], [['3', '4'], 3]])('%p → %p', (raw, expected) => {
    expect(parseBlogPage(raw as string | string[] | undefined)).toBe(expected);
  });
});
