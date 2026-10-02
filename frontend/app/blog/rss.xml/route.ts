import { buildRss } from '@/lib/blogRss';

export const revalidate = 300;

export async function GET() {
  try {
    return new Response(await buildRss(), {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error building blog RSS:', error);
    return new Response('RSS temporarily unavailable', { status: 503 });
  }
}
