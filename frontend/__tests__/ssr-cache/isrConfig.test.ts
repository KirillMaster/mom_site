/** @jest-environment node */
import fs from 'fs';
import path from 'path';

const app = path.join(__dirname, '..', '..', 'app');
const read = (p: string) => fs.readFileSync(path.join(app, p), 'utf-8');
const segments = ['layout.tsx', 'page.tsx', 'about/page.tsx', 'contacts/page.tsx', 'gallery/page.tsx', 'gallery/[slug]/page.tsx', 'reviews/page.tsx', 'videos/page.tsx'];

describe('@US1-AS1 public segments are cacheable', () => {
  it.each(segments)('US1-AS1: %s exports revalidate = 3600 and is not force-dynamic', (file) => {
    const src = read(file);
    expect(src).not.toMatch(/force-dynamic|no-store/);
    expect(src).toMatch(/export const revalidate = 3600;/);
  });
});

describe('@US1-AS3 stale-while-revalidate via ISR', () => {
  it('US1-AS3: every segment uses time-based revalidation (ISR serves stale and rebuilds in background)', () => {
    segments.forEach((file) => expect(read(file)).toMatch(/export const revalidate = \d+;/));
  });
});

describe('@US1-AS2 artwork page built on demand', () => {
  it('US1-AS2: generateStaticParams returns [] and dynamicParams = true without calling the API', async () => {
    jest.resetModules();
    const getGalleryData = jest.fn();
    jest.doMock('@/hooks/useApi', () => ({ getGalleryData, getImageUrl: jest.fn() }));
    jest.doMock('@/lib/artworkPhotos', () => ({ getArtworkPhotos: jest.fn() }));
    jest.doMock('../../app/gallery/[slug]/AskPriceButton', () => () => null);
    jest.doMock('../../app/gallery/[slug]/ArtworkGallery', () => () => null);
    jest.doMock('../../app/gallery/[slug]/RelatedWorks', () => () => null);
    const mod = await import('../../app/gallery/[slug]/page');
    expect(mod.generateStaticParams()).toEqual([]);
    expect(mod.dynamicParams).toBe(true);
    expect(getGalleryData).not.toHaveBeenCalled();
  });
});

describe('@US1-EC1 legacy ?artwork=N links', () => {
  it('US1-EC1: legacy redirect stays in middleware, gallery page does not read searchParams', () => {
    expect(read('gallery/page.tsx')).not.toMatch(/searchParams|cookies\(|headers\(/);
    const mw = fs.readFileSync(path.join(app, '..', 'middleware.ts'), 'utf-8');
    expect(mw).toMatch(/matcher: '\/gallery'/);
    expect(mw).toMatch(/resolveLegacyArtworkRedirect/);
  });
});
