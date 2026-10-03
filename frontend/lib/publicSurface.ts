import fs from 'fs';
import path from 'path';

export const ADMIN_EXCLUSIONS = [
  'app/admin',
  'components/admin',
  'components/blog/admin',
  'components/MessagesList.tsx',
  'components/AdminPageShell.tsx',
  'components/AdminAuthGuard.tsx',
];

const SCAN_ROOTS = ['app', 'components'];
const SOURCE_FILE = /\.(ts|tsx)$/;
const TEST_FILE = /\.(test|spec)\.(ts|tsx)$/;

const toPosix = (p: string) => p.split(path.sep).join('/');

export const isExcluded = (relPath: string): boolean =>
  ADMIN_EXCLUSIONS.some((ex) => relPath === ex || relPath.startsWith(`${ex}/`));

const walk = (root: string, dir: string, out: string[]) => {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = toPosix(path.join(dir, entry.name));
    if (isExcluded(rel)) continue;
    if (entry.isDirectory()) walk(root, rel, out);
    else if (SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name)) out.push(rel);
  }
};

export const listPublicFiles = (root: string): string[] => {
  const out: string[] = [];
  for (const dir of SCAN_ROOTS) walk(root, dir, out);
  return out.sort();
};
