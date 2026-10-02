import { getImageUrl } from '@/hooks/useApi';
import { buildBlogPostSchemas } from '@/lib/blogSeo';
import type { BlogPost } from '@/types/blog';

const escapeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export default function BlogPostJsonLd({ post }: { post: BlogPost }) {
  return (
    <>
      {buildBlogPostSchemas(post, getImageUrl).map((schema) => (
        <script
          key={String(schema['@type'])}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJson(schema) }}
        />
      ))}
    </>
  );
}
