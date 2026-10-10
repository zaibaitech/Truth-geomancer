// Static import-graph walker used by the Stage 1a leak guards.
//
// Deliberately conservative: it follows every value import / re-export /
// dynamic import, and skips only `import type` / `export type` (which are
// erased at compile time and can never put data into a bundle). A client
// file that imports ONE helper from a module is treated as pulling in the
// WHOLE module, because that is what webpack does whenever the module has
// top-level side effects (e.g. `RAW_HATIMS.map(...)`), which is exactly how
// leak L2 happens.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

export const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const RESOLVE_SUFFIXES = ['.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx'];

/** Repo-relative POSIX path, e.g. `content/stars.ts`. */
export function rel(abs: string): string {
  return relative(REPO_ROOT, abs).split('\\').join('/');
}

function resolveSpecifier(fromAbs: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = join(REPO_ROOT, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(fromAbs), spec);
  else return null; // npm package or node builtin: outside the repo's data
  if (existsSync(base) && statSync(base).isFile()) return /\.(tsx?|m?js)$/.test(base) ? base : null;
  for (const suffix of RESOLVE_SUFFIXES) if (existsSync(base + suffix)) return base + suffix;
  return null;
}

const depsCache = new Map<string, string[]>();

/** Value-level dependencies of one file (absolute paths, repo files only). */
export function dependenciesOf(fileAbs: string): string[] {
  const cached = depsCache.get(fileAbs);
  if (cached) return cached;
  const source = readFileSync(fileAbs, 'utf8');
  const out = new Set<string>();
  const staticRe = /(?:^|[\s;}])(import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = staticRe.exec(source))) {
    if (m[2]) continue; // `import type` / `export type`
    const r = resolveSpecifier(fileAbs, m[3]);
    if (r) out.add(r);
  }
  const dynamicRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynamicRe.exec(source))) {
    const r = resolveSpecifier(fileAbs, m[1]);
    if (r) out.add(r);
  }
  const list = Array.from(out);
  depsCache.set(fileAbs, list);
  return list;
}

export function isClientModule(fileAbs: string): boolean {
  const head = readFileSync(fileAbs, 'utf8').slice(0, 400).replace(/^(\s*\/\/[^\n]*\n|\s*\/\*[\s\S]*?\*\/)*/, '');
  return /^\s*['"]use client['"]/.test(head);
}

export interface Reach {
  /** Every file reachable from the entry (server and client side). */
  all: Map<string, string[]>;
  /** Files reachable from the entry THROUGH a 'use client' boundary, i.e.
   * code that is shipped to the browser. Value = one example import chain. */
  client: Map<string, string[]>;
}

/** Walks the graph from one entry file, tracking which files end up on the
 * client side of a `'use client'` boundary. */
export function reachFrom(entryAbs: string): Reach {
  const all = new Map<string, string[]>();
  const client = new Map<string, string[]>();
  const seen = new Set<string>();
  const visit = (file: string, chain: string[], inClient: boolean) => {
    const nowClient = inClient || isClientModule(file);
    const key = `${nowClient ? 'c' : 's'}:${file}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (!all.has(file)) all.set(file, chain);
    if (nowClient && !client.has(file)) client.set(file, chain);
    for (const dep of dependenciesOf(file)) visit(dep, [...chain, rel(dep)], nowClient);
  };
  visit(entryAbs, [rel(entryAbs)], false);
  return { all, client };
}

export function listSourceFiles(dirRel: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git', '.data'].includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
    }
  };
  walk(join(REPO_ROOT, dirRel));
  return out;
}

/** Union of client-reachable files over every `'use client'` module in the
 * app (the app-wide client bundle surface). */
export function appWideClientReach(): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const roots = [...listSourceFiles('app'), ...listSourceFiles('components'), ...listSourceFiles('lib')].filter(isClientModule);
  for (const root of roots) {
    for (const [file, chain] of Array.from(reachFrom(root).client)) if (!result.has(file)) result.set(file, chain);
  }
  return result;
}
