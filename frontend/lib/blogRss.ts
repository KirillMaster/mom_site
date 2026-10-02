import { getImageUrl } from '@/hooks/useApi';
import { getBlogPost, getLatestBlogPosts } from './blogApi';
import { blogPostUrl, SITE_URL } from './blogSeo';
import type { BlogPostListItem } from '../types/blog';

const RSS_LIMIT = 50;

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const cdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

const imageType = (url: string) => (/\.png$/i.test(url) ? 'image/png' : /\.webp$/i.test(url) ? 'image/webp' : 'image/jpeg');

function renderItem(post: BlogPostListItem, bodyHtml: string): string {
  const link = blogPostUrl(post.slug);
  const cover = post.coverImagePath ? getImageUrl(post.coverImagePath) : null;
  return [
    '<item>',
    `<title>${escapeXml(post.title)}</title>`,
    `<link>${link}</link>`,
    `<guid isPermaLink="true">${link}</guid>`,
    `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
    `<category>${escapeXml(post.category.name)}</category>`,
    `<description>${escapeXml(post.excerpt)}</description>`,
    cover ? `<enclosure url="${escapeXml(cover)}" type="${imageType(cover)}" length="0"/>` : '',
    `<content:encoded>${cdata(bodyHtml)}</content:encoded>`,
    '</item>',
  ].join('');
}

export async function buildRss(): Promise<string> {
  const posts = await getLatestBlogPosts(RSS_LIMIT);
  const bodies = await Promise.all(
    posts.map((post) => getBlogPost(post.slug).then((data) => data?.post.bodyHtml ?? '').catch(() => '')),
  );
  const items = posts.map((post, i) => renderItem(post, bodies[i])).join('');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">' +
    '<channel>' +
    '<title>Блог — Анжела Моисеенко</title>' +
    `<link>${SITE_URL}/blog</link>` +
    '<description>Новости, выставки и рассказы о картинах художника Анжелы Моисеенко.</description>' +
    '<language>ru</language>' +
    `<atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>` +
    items +
    '</channel></rss>'
  );
}
