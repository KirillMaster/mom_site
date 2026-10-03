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

describe('@US8-EC1 boundary and edge cases for quote handling', () => {
  it('handles whitespace-only input by returning empty string', () => {
    expect(normalizeTitle('   ')).toBe('');
    expect(normalizeTitle('\t\n  ')).toBe('');
  });

  it('handles only quotes as outer pair', () => {
    expect(normalizeTitle('""')).toBe('');
    expect(normalizeTitle("''")).toBe('');
    expect(normalizeTitle('«»')).toBe('');
  });

  it('unbalanced inner quotes do not prevent outer pair stripping', () => {
    expect(normalizeTitle('«hello " world»')).toBe('hello " world');
  });

  it('multiple levels of nested quotes preserve inner structure', () => {
    expect(normalizeTitle('«"inner" text»')).toBe('"inner" text');
  });

  it('does not strip when first char is quote but last is different quote', () => {
    expect(normalizeTitle('"hello»')).toBe('"hello»');
    expect(normalizeTitle('«hello"')).toBe('«hello"');
  });

  it('handles very long quoted titles', () => {
    const longText = 'A'.repeat(500);
    expect(normalizeTitle(`"${longText}"`)).toBe(longText);
  });

  it('whitespace inside quotes is preserved and trimmed by filled function', () => {
    expect(normalizeTitle('"  spaced  "')).toBe('spaced');
    expect(normalizeTitle('« \n\t  »')).toBe('');
  });

  it('handles single quote at position 0 only', () => {
    expect(normalizeTitle('"alone')).toBe('"alone');
    expect(normalizeTitle('alone"')).toBe('alone"');
  });

  it('repeated same quote type does not strip if unbalanced in inner', () => {
    expect(normalizeTitle('«outer « inner»')).toBe('outer « inner');
  });

  it('empty inner text after stripping returns empty', () => {
    expect(normalizeTitle('""')).toBe('');
    expect(normalizeTitle('«»')).toBe('');
  });
});
