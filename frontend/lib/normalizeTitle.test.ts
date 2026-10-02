import { normalizeTitle, quotedTitle } from './normalizeTitle';

describe('@US8-AS1 normalizeTitle strips one pair of wrapping quotes', () => {
  it.each([
    ['"Утро"', 'Утро'],
    ['«Утро»', 'Утро'],
    ["'Утро'", 'Утро'],
    ['„Утро“', 'Утро'],
    ['“Утро”', 'Утро'],
    ['Утро', 'Утро'],
    ['  "Закат"  ', 'Закат'],
    ['', ''],
  ])('normalizes %s to %s', (raw, expected) => {
    expect(normalizeTitle(raw)).toBe(expected);
  });

  it('returns empty string for null and undefined', () => {
    expect(normalizeTitle(null)).toBe('');
    expect(normalizeTitle(undefined)).toBe('');
  });

  it('quotedTitle wraps the normalized title in guillemets', () => {
    expect(quotedTitle('"Закат"')).toBe('«Закат»');
    expect(quotedTitle('«Утро»')).toBe('«Утро»');
    expect(quotedTitle('Утро')).toBe('«Утро»');
  });

  it('quotedTitle of an empty title is empty', () => {
    expect(quotedTitle('')).toBe('');
    expect(quotedTitle(null)).toBe('');
  });
});

describe('@US8-AS2 inner quotes are preserved and input is not mutated', () => {
  it('keeps inner quotes after stripping the outer pair', () => {
    expect(normalizeTitle('«Дом "у моря"»')).toBe('Дом "у моря"');
  });

  it('leaves titles with only inner quotes unchanged', () => {
    expect(normalizeTitle('Дом «у моря»')).toBe('Дом «у моря»');
  });

  it('does not strip when the outer characters are not a matching pair', () => {
    expect(normalizeTitle('«Утро"')).toBe('«Утро"');
  });

  it('does not merge two separately quoted fragments', () => {
    expect(normalizeTitle('«Утро» и «Вечер»')).toBe('«Утро» и «Вечер»');
  });

  it('a single quote character is left alone', () => {
    expect(normalizeTitle('"')).toBe('"');
  });
});
