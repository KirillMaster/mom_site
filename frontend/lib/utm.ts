export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

const COOKIE_NAME = 'utm_ft';
const MAX_AGE_DAYS = 90;
const FIELDS: (keyof UtmParams)[] = ['utm_source', 'utm_medium', 'utm_campaign'];
const MAX_VALUE_LENGTH = 200;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getStoredUtm(): UtmParams {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as UtmParams;
    return FIELDS.reduce<UtmParams>((acc, field) => {
      const value = parsed[field];
      if (typeof value === 'string' && value) acc[field] = value;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function parseFromLocation(search: string): UtmParams {
  const params = new URLSearchParams(search);
  return FIELDS.reduce<UtmParams>((acc, field) => {
    const value = params.get(field);
    if (value) acc[field] = value.slice(0, MAX_VALUE_LENGTH);
    return acc;
  }, {});
}

// First touch wins: the campaign that originally brought the visitor is the
// one credited when they eventually submit the form, so an existing cookie is
// never overwritten by a later visit from another source.
export function captureUtm(): UtmParams {
  if (typeof window === 'undefined') return {};

  const stored = getStoredUtm();
  if (Object.keys(stored).length > 0) return stored;

  const incoming = parseFromLocation(window.location.search);
  if (Object.keys(incoming).length === 0) return {};

  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(incoming))}` +
    `; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;

  return incoming;
}
