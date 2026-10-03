import Link from 'next/link';
import { getImageUrl } from '@/hooks/useApi';
import { formatBlogDate } from '@/lib/blogFormat';
import type { BlogPostListItem } from '@/types/blog';

interface PostCardProps {
  post: BlogPostListItem;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article data-testid="post-card" className="overflow-hidden rounded-md bg-paper-50 border border-line">
      <Link href={`/blog/${post.slug}`} className="group block">
        {post.coverImagePath && (
          <img
            src={getImageUrl(post.coverImagePath)}
            alt={post.coverAlt || post.title}
            loading="lazy"
            className="aspect-[3/2] w-full object-cover transition-opacity group-hover:opacity-90"
          />
        )}
        <div className="p-5">
          <p className="mb-2 text-sm text-ochre-700">{post.category.name}</p>
          <h2 className="mb-2 font-serif text-xl font-semibold text-ink group-hover:text-sea-700">{post.title}</h2>
          <p className="mb-3 text-ink-500">{post.excerpt}</p>
          <p className="text-sm text-ink-500">
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            {' · '}{post.readingMinutes} мин чтения
          </p>
        </div>
      </Link>
    </article>
  );
}
