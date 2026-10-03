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
