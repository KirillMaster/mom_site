import fs from 'fs';
import path from 'path';
import { formatPrice, priceLabel } from '@/lib/price';
import type { ArtworkDto } from '@/lib/api';

const root = path.resolve(__dirname, '..');
const rel = (f: string) => path.relative(root, f).split(path.sep).join('/');
const norm = (s: string) => s.replace(/[\u00A0\u202F]/g, ' ');
const art = (o: Partial<ArtworkDto>) => ({ id: 1, title: 't', status: 'Available', isForSale: true, ...o }) as ArtworkDto;

describe('@US3-FE1 formatPrice', () => {
  it.each([[1500, '1 500 ₽'], [45000, '45 000 ₽'], [1250000, '1 250 000 ₽']])('%s', (n, exp) => {
    expect(norm(formatPrice(n))).toBe(exp);
  });
});

describe('@US3-FE2 priceLabel', () => {
  it('picks price or status', () => {
    expect(priceLabel(art({ price: 0 }), false)).toBe('цена по запросу');
    expect(priceLabel(art({ price: null as unknown as undefined }), false)).toBe('цена по запросу');
    expect(norm(priceLabel(art({ price: 45000 }), false)!)).toBe('45 000 ₽');
    expect(priceLabel(art({ status: 'Sold', isForSale: false, price: 100 }), false)).toBe('Продана');
    expect(priceLabel(art({ price: 100 }), true)).toBeNull();
  });
});

describe('@US3-FE3 single price impl', () => {
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    ['node_modules', '.next', 'e2e', '__tests__'].includes(e.name) ? [] :
      e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [path.join(d, e.name)] : []);
  const files = walk(root);
  it('defines formatPrice only in lib/price.ts', () => {
    const defs = files.filter((f) => /(const|function)\s+formatPrice\b/.test(fs.readFileSync(f, 'utf8')));
    expect(defs.map((f) => rel(f))).toEqual(['lib/price.ts']);
  });
  it('defines SITE_PHONE in lib/site.ts and lib has no component imports', () => {
    const defs = files.filter((f) => /const\s+SITE_PHONE\s*=/.test(fs.readFileSync(f, 'utf8')));
    expect(defs.map((f) => rel(f))).toEqual(['lib/site.ts']);
    const bad = files.filter((f) => f.includes(`${path.sep}lib${path.sep}`) && /from '@\/components/.test(fs.readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });
});

describe('price boundary: priceLabel status variants', () => {
  it('returns null for exhibition mode regardless of price', () => {
    expect(priceLabel(art({ price: 45000, status: 'Available' }), true)).toBeNull();
    expect(priceLabel(art({ price: 0, status: 'Available' }), true)).toBeNull();
    expect(priceLabel(art({ price: null, status: 'Available' }), true)).toBeNull();
  });
  it('returns Sold status label for Sold artwork', () => {
    expect(priceLabel(art({ status: 'Sold', isForSale: false, price: 45000 }), false)).toBe('Продана');
  });
  it('returns PrivateCollection status label', () => {
    expect(priceLabel(art({ status: 'PrivateCollection', isForSale: false, price: 45000 }), false)).toBe('В частной коллекции');
  });
  it('returns NotForSale status label', () => {
    expect(priceLabel(art({ status: 'NotForSale', isForSale: false, price: 45000 }), false)).toBe('Не продаётся');
  });
  it('does not show price when status is Sold even with non-zero price', () => {
    const result = priceLabel(art({ status: 'Sold', isForSale: false, price: 999999 }), false);
    expect(result).toBe('Продана');
    expect(result).not.toContain('₽');
  });
});

describe('price boundary: price edge cases', () => {
  it('handles very large prices', () => {
    const result = norm(priceLabel(art({ price: 999999999 }), false)!);
    expect(result).toBe('999 999 999 ₽');
  });
  it('handles single digit price', () => {
    const result = norm(priceLabel(art({ price: 5 }), false)!);
    expect(result).toBe('5 ₽');
  });
  it('handles price = 1', () => {
    const result = norm(priceLabel(art({ price: 1 }), false)!);
    expect(result).toBe('1 ₽');
  });
  it('shows цена по запросу when price is negative (edge case)', () => {
    expect(priceLabel(art({ price: -100 }), false)).toBe('цена по запросу');
  });
});

describe('price boundary: formatPrice spacing', () => {
  it('formats with non-breaking spaces correctly', () => {
    const formatted = formatPrice(1000);
    expect(formatted).toContain('₽');
    expect(formatted).toMatch(/\d\s+\d/);
  });
  it('preserves exact format for test consistency', () => {
    expect(formatPrice(45000)).toMatch(/45\s+000\s+₽/);
  });
});
