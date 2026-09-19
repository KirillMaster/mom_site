// Artwork slugs are derived, never stored: the Artwork model has no slug
// column and the DB schema must not change. A slug is `<transliterated
// title>-<id>`; resolution always trusts the trailing id and ignores the
// title text, so a stale or wrong title segment still finds the artwork
// (S1-AS6) while two artworks sharing a title still get distinct, resolvable
// slugs because the id disambiguates (S1-AS8).

export interface SlugArtwork {
  id: number;
  title: string;
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => (ch in CYRILLIC_TO_LATIN ? CYRILLIC_TO_LATIN[ch] : ch))
    .join('');
}

// Lowercase latin letters, digits and hyphens only — anything else
// (punctuation, quotes, whitespace, leftover non-latin symbols) collapses
// into a single separating hyphen.
export function slugifyTitle(title: string): string {
  const transliterated = transliterate(title || '');
  const slug = transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'artwork';
}

export function buildArtworkSlug(title: string, id: number): string {
  return `${slugifyTitle(title)}-${id}`;
}

// Pulls the trailing numeric id off a slug, e.g. "osenniy-sad-7" -> 7.
// Returns null when the slug has no trailing "-<digits>" segment at all.
export function extractIdFromSlug(slug: string): number | null {
  const match = /-([0-9]+)$/.exec(slug || '');
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

export function resolveArtworkById<T extends SlugArtwork>(id: number, artworks: T[]): T | null {
  return artworks.find((artwork) => artwork.id === id) ?? null;
}

// The id in the slug always wins over the title text it carries — a stale
// title segment (S1-AS6) or one that never existed (S1-AS4/S1-AS5) simply
// fails to resolve rather than being trusted.
export function resolveArtworkBySlug<T extends SlugArtwork>(slug: string, artworks: T[]): T | null {
  const id = extractIdFromSlug(slug);
  if (id === null) return null;
  return resolveArtworkById(id, artworks);
}

export type LegacyRedirectResult =
  | { kind: 'redirect'; slug: string }
  | { kind: 'not-found' };

// Pure decision for the legacy `?artwork=N` query string. A missing/garbage
// id or one that matches no artwork must never redirect into a dead page
// (S1-AS3) — it reports not-found instead.
export function resolveLegacyArtworkRedirect<T extends SlugArtwork>(
  idParam: string | null | undefined,
  artworks: T[]
): LegacyRedirectResult {
  const id = idParam !== null && idParam !== undefined && idParam !== '' ? Number(idParam) : NaN;
  if (!Number.isFinite(id)) return { kind: 'not-found' };
  const artwork = resolveArtworkById(id, artworks);
  if (!artwork) return { kind: 'not-found' };
  return { kind: 'redirect', slug: buildArtworkSlug(artwork.title, artwork.id) };
}
