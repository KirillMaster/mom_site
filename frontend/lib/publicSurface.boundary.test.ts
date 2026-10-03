import fs from 'fs';
import os from 'os';
import path from 'path';
import { ADMIN_EXCLUSIONS, isExcluded, listPublicFiles } from './publicSurface';

describe('@US1-EC5 isExcluded boundaries', () => {
  it.each(ADMIN_EXCLUSIONS)('excludes %s itself and its children', (ex) => {
    expect(isExcluded(ex)).toBe(true);
    expect(isExcluded(`${ex}/x.tsx`)).toBe(true);
  });

  it('does not exclude siblings sharing only a name prefix', () => {
    expect(isExcluded('app/administrator/page.tsx')).toBe(false);
    expect(isExcluded('app/admin2')).toBe(false);
    expect(isExcluded('components/MessagesList2.tsx')).toBe(false);
    expect(isExcluded('components/blog/administrator/x.tsx')).toBe(false);
  });

  it('does not exclude a path that merely ends with an excluded one', () => {
    expect(isExcluded('x/app/admin/page.tsx')).toBe(false);
  });
});

describe('@US1-FE6 listPublicFiles scanning rules', () => {
  let tmp: string;
  const put = (rel: string) => {
    const full = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '');
  };

  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'surface-'));
    put('app/page.tsx');
    put('app/b/zeta.ts');
    put('app/a/alpha.tsx');
    put('app/a/alpha.test.tsx');
    put('app/a/alpha.spec.ts');
    put('app/a/alpha.boundary.test.tsx');
    put('app/a/style.css');
    put('app/a/script.js');
    put('app/admin/page.tsx');
    put('app/admin/deep/x.tsx');
    put('app/administrator/page.tsx');
    put('components/Card.tsx');
    put('components/MessagesList.tsx');
    put('components/MessagesList2.tsx');
    put('components/blog/Post.tsx');
    put('components/blog/admin/Editor.tsx');
    put('lib/outside.ts');
    put('hooks/outside.ts');
  });

  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('returns only non-test ts/tsx under app and components, sorted, posix, admin excluded', () => {
    expect(listPublicFiles(tmp)).toEqual([
      'app/a/alpha.tsx',
      'app/administrator/page.tsx',
      'app/b/zeta.ts',
      'app/page.tsx',
      'components/Card.tsx',
      'components/MessagesList2.tsx',
      'components/blog/Post.tsx',
    ]);
  });
});
