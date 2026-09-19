import {
  buildArtworkSlug,
  extractIdFromSlug,
  resolveArtworkBySlug,
  resolveLegacyArtworkRedirect,
} from '@/lib/artworkSlug';

describe('@S1-AS7 cyrillic and punctuation produce a clean, unique, resolvable slug', () => {
  it('emits only lowercase latin letters, digits and hyphens, ending with the id', () => {
    const slug = buildArtworkSlug('«Мама, я тебя люблю!» (этюд)', 12);
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug.endsWith('-12')).toBe(true);
  });

  it('resolves back to the same artwork via its trailing id', () => {
    const slug = buildArtworkSlug('«Мама, я тебя люблю!» (этюд)', 12);
    const artworks = [{ id: 12, title: '«Мама, я тебя люблю!» (этюд)' }];
    expect(resolveArtworkBySlug(slug, artworks)?.id).toBe(12);
  });
});

describe('@S1-AS8 two artworks with an identical title get distinct slugs', () => {
  it('disambiguates identical titles by id', () => {
    const slugA = buildArtworkSlug('Натюрморт', 3);
    const slugB = buildArtworkSlug('Натюрморт', 88);
    expect(slugA).not.toBe(slugB);

    const artworks = [
      { id: 3, title: 'Натюрморт' },
      { id: 88, title: 'Натюрморт' },
    ];
    expect(resolveArtworkBySlug(slugA, artworks)?.id).toBe(3);
    expect(resolveArtworkBySlug(slugB, artworks)?.id).toBe(88);
  });
});

describe('@S1-AS6 the id in the slug wins over a stale or mismatched title segment', () => {
  it('resolves by trailing id regardless of the words before it', () => {
    const artworks = [{ id: 7, title: 'Осенний сад' }];
    expect(resolveArtworkBySlug('wrong-title-text-7', artworks)?.id).toBe(7);
  });
});

describe('@S1-AS5 a slug whose trailing id matches no artwork resolves to nothing', () => {
  it('returns null when no artwork has that id', () => {
    const artworks = [{ id: 7, title: 'Осенний сад' }];
    expect(resolveArtworkBySlug('osenniy-sad-42', artworks)).toBeNull();
  });
});

describe('@S1-AS4 an unresolvable slug (no trailing id) resolves to nothing', () => {
  it('returns null when the slug has no numeric artwork among the ids present', () => {
    const artworks: { id: number; title: string }[] = [];
    expect(resolveArtworkBySlug('this-slug-does-not-exist-1', artworks)).toBeNull();
  });
});

describe('extractIdFromSlug', () => {
  it('reads the trailing numeric segment', () => {
    expect(extractIdFromSlug('osenniy-sad-7')).toBe(7);
  });

  it('returns null when there is no trailing numeric segment', () => {
    expect(extractIdFromSlug('no-id-here')).toBeNull();
  });
});

describe('@S1-AS2 the legacy query-string id resolves to the canonical slug', () => {
  it('redirects to the slug for an artwork that exists', () => {
    const artworks = [{ id: 7, title: 'Осенний сад' }];
    const result = resolveLegacyArtworkRedirect('7', artworks);
    expect(result).toEqual({ kind: 'redirect', slug: 'osenniy-sad-7' });
  });
});

describe('@S1-AS3 a legacy id for a nonexistent artwork never redirects into a dead page', () => {
  it('reports not-found instead of building a slug for a missing id', () => {
    const artworks = [{ id: 7, title: 'Осенний сад' }];
    expect(resolveLegacyArtworkRedirect('999999', artworks)).toEqual({ kind: 'not-found' });
  });

  it('reports not-found for a missing or non-numeric id param', () => {
    const artworks = [{ id: 7, title: 'Осенний сад' }];
    expect(resolveLegacyArtworkRedirect(null, artworks)).toEqual({ kind: 'not-found' });
    expect(resolveLegacyArtworkRedirect('abc', artworks)).toEqual({ kind: 'not-found' });
  });
});
