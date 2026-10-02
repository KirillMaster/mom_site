import { timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { startWarmup } from '@/lib/cacheWarmup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function secretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get('x-revalidate-secret'), process.env.REVALIDATE_SECRET)) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  revalidatePath('/', 'layout');
  const { status } = startWarmup();
  return NextResponse.json({ revalidated: true, warmup: status });
}
