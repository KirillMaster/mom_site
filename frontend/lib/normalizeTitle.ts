const PAIRS: Record<string, string[]> = {
  '"': ['"'],
  "'": ["'"],
  '«': ['»'],
  '„': ['“', '”'],
  '“': ['”'],
};

// For distinct opener/closer pairs, the closer must not appear in the inner
// text before a matching opener — otherwise «A» и «B» would be "unwrapped".
function isBalanced(inner: string, open: string, closers: string[]): boolean {
  if (closers.includes(open)) return true;
  let depth = 0;
  for (const ch of inner) {
    if (ch === open) depth += 1;
    else if (closers.includes(ch)) {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return true;
}

export function normalizeTitle(raw: string | null | undefined): string {
  const text = (raw ?? '').trim();
  if (text.length < 2) return text;
  const first = text[0];
  const last = text[text.length - 1];
  const closers = PAIRS[first];
  if (!closers || !closers.includes(last)) return text;
  const inner = text.slice(1, -1);
  return isBalanced(inner, first, closers) ? inner.trim() : text;
}

export function quotedTitle(raw: string | null | undefined): string {
  const title = normalizeTitle(raw);
  return title ? `«${title}»` : '';
}
