import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('../tailwind.config.js');
const colors = config.theme.extend.colors;
const root = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('@US1-FE1 palette contrast', () => {
  it.each([
    ['ink', 'paper', colors.ink.DEFAULT, colors.paper.DEFAULT],
    ['ink-500', 'paper', colors.ink[500], colors.paper.DEFAULT],
    ['white', 'sea', '#FFFFFF', colors.sea.DEFAULT],
    ['sea', 'paper', colors.sea.DEFAULT, colors.paper.DEFAULT],
    ['ochre-700', 'paper', colors.ochre[700], colors.paper.DEFAULT],
  ])('%s on %s >= 4.5', (_a, _b, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('@US1-FE2 tokens', () => {
  it('defines palette and keeps legacy tokens', () => {
    expect(colors.paper.DEFAULT).toBe('#F7F6F3');
    expect(colors.ink.DEFAULT).toBe('#1F2328');
    expect(colors.sea.DEFAULT).toBe('#2F4A5C');
    expect(colors.ochre.DEFAULT).toBe('#B8862F');
    expect(colors.line.DEFAULT).toBe('#E2DED6');
    expect(colors.primary).toBeDefined();
    expect(colors.secondary).toBeDefined();
    expect(colors.warm).toBeDefined();
  });
  it('has no gradient in gradient-bg / text-gradient', () => {
    const css = read('app/globals.css');
    const rules = css.match(/\.(gradient-bg|text-gradient)\s*\{[^}]*\}/g) ?? [];
    rules.forEach((r) => expect(r).not.toMatch(/gradient\(/));
  });
});

describe('@US2-AS1 fonts', () => {
  const layout = read('app/layout.tsx');
  it('connects Cormorant Garamond and Manrope', () => {
    expect(layout).toContain('Cormorant_Garamond(');
    expect(layout).toContain('Manrope(');
    expect(layout).toContain("variable: '--font-serif'");
    expect(layout).toContain("weight: ['500', '600']");
    expect(layout).toContain("variable: '--font-sans'");
    expect(layout).toContain("weight: ['400', '500', '600']");
    expect(layout).toContain("subsets: ['latin', 'cyrillic']");
    expect(layout).toContain("display: 'swap'");
    expect(layout).toMatch(/bg-paper text-ink font-sans/);
    expect(layout).not.toMatch(/Playfair|Inter\b/);
  });
  it('uses serif for h1-h4', () => {
    const css = read('app/globals.css');
    expect(css).toMatch(/h1,\s*h2,\s*h3,\s*h4[^{]*\{[^}]*font-serif/);
  });
});

describe('@US2-EC1 fallback fonts', () => {
  it('ends with generic families', () => {
    const ff = config.theme.extend.fontFamily;
    expect(ff.serif[ff.serif.length - 1]).toBe('serif');
    expect(ff.sans[ff.sans.length - 1]).toBe('sans-serif');
    expect(ff.serif[0]).toBe('var(--font-serif)');
    expect(ff.sans[0]).toBe('var(--font-sans)');
  });
});

describe('@US2-AS2 prose measure', () => {
  it('limits to 75ch', () => {
    expect(read('app/globals.css')).toMatch(/\.prose-measure\s*\{[^}]*max-width:\s*75ch/);
  });
});

describe('@US4-EC4 reduced motion', () => {
  it('disables animations', () => {
    const css = read('app/globals.css');
    const m = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/);
    expect(m).not.toBeNull();
    expect(m![1]).toMatch(/animation:\s*none/);
    expect(m![1]).toMatch(/transition:\s*none|transition-duration/);
    expect(m![1]).toContain('rise-in');
  });
});

describe('@US1-FE1 additional palette contrast checks', () => {
  it('ochre-700 on white background meets AA', () => {
    const ochreWhiteContrast = contrast(colors.ochre[700], '#FFFFFF');
    expect(ochreWhiteContrast).toBeGreaterThanOrEqual(4.5);
  });

  it('ink on white background exceeds AA', () => {
    const inkWhiteContrast = contrast(colors.ink.DEFAULT, '#FFFFFF');
    expect(inkWhiteContrast).toBeGreaterThanOrEqual(4.5);
  });

  it('all palette colors are properly defined hex values', () => {
    expect(colors.paper.DEFAULT).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors.ink.DEFAULT).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors.sea.DEFAULT).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors.ochre.DEFAULT).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors.line.DEFAULT).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('@US2-AS1 font display swap', () => {
  it('both fonts use display=swap for performance', () => {
    const layout = read('app/layout.tsx');
    const swaps = (layout.match(/display:\s*['"]swap['"]/g) || []).length;
    expect(swaps).toBeGreaterThanOrEqual(2);
  });
});

describe('@US2-AS2 prose measure line length limit', () => {
  it('text articles constrained to readable line length', () => {
    const css = read('app/globals.css');
    expect(css).toContain('prose-measure');
    expect(css).toMatch(/prose-measure[^}]*max-width[^}]*75ch/);
  });
});

describe('@US3-FE3 single price implementation is enforced', () => {
  it('no formatPrice copy-pastes in other files', () => {
    const walk = (d: string): string[] => {
      return fs.readdirSync(d, { withFileTypes: true }).flatMap((e: any) =>
        ['node_modules', '.next', 'e2e', '__tests__'].includes(e.name) ? [] :
          e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [path.join(d, e.name)] : []);
    };
    const files = walk(root);
    const priceImplementations = files.filter((f) => {
      const content = fs.readFileSync(f, 'utf8');
      return /new\s+Intl\.NumberFormat/.test(content) || /format\(['"]ru-RU/.test(content);
    });
    const normalized = priceImplementations.map((f) => f.replace(root, '.').split(path.sep).join('/'));
    expect(normalized).toEqual(['./lib/price.ts']);
  });
});

describe('@US4-FE1 button focus ring color', () => {
  it('focus ring is always sea color across variants', () => {
    const button = read('components/ui/Button.tsx');
    expect(button).toContain('focus-visible:ring-sea');
    expect(button).toMatch(/focus-visible:ring-sea/g);
  });
});
