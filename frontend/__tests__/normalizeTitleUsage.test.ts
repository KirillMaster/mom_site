import { buildSeoTitle, buildSeoDescription, buildArtworkSchema, buildBreadcrumbSchema } from '@/app/gallery/[slug]/artworkSeo';

jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => `https://cdn.test${p}`,
}));

const artwork = { id: 5, title: '"Утро"', description: '', isForSale: false };

describe('@US8-AS3 artwork SEO uses the normalized title', () => {
  it('title, description, JSON-LD name and breadcrumb carry no double quotes', () => {
    expect(buildSeoTitle(artwork)).toContain('«Утро»');
    expect(buildSeoDescription(artwork)).toContain('«Утро»');
    expect(buildSeoTitle(artwork)).not.toContain('"');
    expect(buildSeoDescription(artwork)).not.toContain('"');
    expect(buildArtworkSchema(artwork, []).name).toBe('Утро');
    const crumb = buildBreadcrumbSchema(artwork).itemListElement[2];
    expect(crumb.name).toBe('Утро');
  });
});
