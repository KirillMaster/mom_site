import { NextRequest, NextResponse } from 'next/server';
import { resolveLegacyArtworkRedirect } from '@/lib/artworkSlug';

// Only /gallery ever carried the legacy `?artwork=N` links (old emails,
// bookmarks, indexed search results); everything else passes through
// untouched.
export const config = {
  matcher: '/gallery',
};

function apiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://angelamoiseenko.ru/api'
  );
}

export async function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  if (!searchParams.has('artwork')) {
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${apiBaseUrl()}/public/gallery`);
    if (!response.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const data = await response.json();
    const artworks = data.artworks?.$values || data.artworks || [];
    const result = resolveLegacyArtworkRedirect(searchParams.get('artwork'), artworks);

    if (result.kind === 'not-found') {
      return new NextResponse(null, { status: 404 });
    }

    const url = request.nextUrl.clone();
    url.pathname = `/gallery/${result.slug}`;
    url.search = '';
    // A permanent redirect: search engines must drop the old query-string
    // URL from the index in favour of the slug (S1-AS2), never leave a dead
    // link when the id doesn't resolve (S1-AS3).
    return NextResponse.redirect(url, 301);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
