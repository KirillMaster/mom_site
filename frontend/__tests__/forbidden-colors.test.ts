import fs from 'fs';
import path from 'path';
import { ADMIN_EXCLUSIONS, isExcluded, listPublicFiles } from '@/lib/publicSurface';

const root = path.resolve(__dirname, '..');

const FORBIDDEN =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|shadow|divide|placeholder)-(?:primary|secondary|warm|purple|indigo|blue|violet|fuchsia|orange)-[\w/.-]*|bg-gradient-[\w-]*|gradient-bg|text-gradient/g;

const findViolations = (relPath: string, source: string): string[] =>
  source.split('\n').flatMap((line, i) =>
    Array.from(line.matchAll(FORBIDDEN)).map((m) => `${relPath}:${i + 1}:${m[0]}`),
  );

describe('@US1-FE6 forbidden colour guard on public files', () => {
  it('finds no legacy colour classes in public app/** and components/**', () => {
    const files = listPublicFiles(root);
    expect(files.length).toBeGreaterThan(20);
    const violations = files.flatMap((f) => findViolations(f, fs.readFileSync(path.join(root, f), 'utf8')));
    expect(violations).toEqual([]);
  });

  it('globals.css has no gradient', () => {
    const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
    expect(css).not.toMatch(/gradient/i);
  });
});

describe('@US1-FE7 guard reports file, line and class', () => {
  it('reports components/Footer.tsx with line number and bg-primary-500', () => {
    const src = 'export const A = () => (\n  <div className="p-2 bg-primary-500" />\n);\n';
    expect(findViolations('components/Footer.tsx', src)).toEqual(['components/Footer.tsx:2:bg-primary-500']);
  });
});

describe('@US1-EC5 admin files are excluded', () => {
  it('does not scan admin paths', () => {
    const files = listPublicFiles(root);
    for (const ex of ADMIN_EXCLUSIONS) {
      expect(files.filter((f) => f === ex || f.startsWith(`${ex}/`))).toEqual([]);
    }
    expect(isExcluded('app/admin/page.tsx')).toBe(true);
    expect(isExcluded('components/blog/admin/PostEditor.tsx')).toBe(true);
    expect(isExcluded('components/blog/PostCard.tsx')).toBe(false);
  });

  it('admin sources still use legacy classes (allowed there)', () => {
    const src = fs.readFileSync(path.join(root, 'app/admin/page.tsx'), 'utf8');
    expect(findViolations('app/admin/page.tsx', src).length).toBeGreaterThan(0);
  });
});
