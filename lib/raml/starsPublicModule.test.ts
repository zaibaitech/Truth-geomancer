// content/stars.ts is reachable from client code, so it must hold only the free figure basics. The paid
// per-star content (house-6 / house-2 meanings and remedies, sadaqah offerings and days, element
// occupations) lives in lib/server/content/starNotes.ts. These tests fail if any of it comes back.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ELEMENT_LABEL, STARS } from '@/content/stars';
import { ELEMENT_OCCUPATIONS, STAR_NOTES } from '@/lib/server/content/starNotes';

const ROOT = path.resolve(__dirname, '../..');
const protectedStrings = (): string[] => [
  ...Object.values(STAR_NOTES).flatMap((n) => [n.house6.meaning, n.house6.remedy, n.house2.meaning, n.house2.remedy, n.sadaqah.offering, n.sadaqah.day]),
  ...Object.values(ELEMENT_OCCUPATIONS),
];

describe('content/stars.ts is the public figure basics only', () => {
  it('every star has exactly id, number, name, pattern and element', () => {
    expect(STARS).toHaveLength(16);
    for (const s of STARS) expect(Object.keys(s).sort()).toEqual(['element', 'id', 'name', 'number', 'pattern']);
  });
  it('exports only the labels, the figures and the two lookups', async () => {
    const mod = await import('@/content/stars');
    expect(Object.keys(mod).sort()).toEqual(['ELEMENT_LABEL', 'STARS', 'getStarById', 'getStarByPattern']);
    expect(Object.keys(ELEMENT_LABEL).sort()).toEqual(['air', 'fire', 'sand', 'water']);
  });
  it('its source contains none of the protected strings and none of the protected field names', () => {
    const src = readFileSync(path.join(ROOT, 'content/stars.ts'), 'utf8');
    for (const s of protectedStrings()) expect(src.includes(s)).toBe(false);
    expect(src).not.toMatch(/\b(remedy|offering|sadaqah|house6|house2)\b/i);
  });
  it('no value of any figure is a protected string', () => {
    const protectedSet = new Set(protectedStrings());
    const walk = (v: unknown): void => {
      if (typeof v === 'string') expect(protectedSet.has(v)).toBe(false);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(STARS);
  });
});

describe('the protected star fields exist only in server code', () => {
  const walkDir = (dir: string, out: string[] = []): string[] => {
    for (const e of readdirSync(dir)) {
      if (['node_modules', '.next', '.git'].includes(e)) continue;
      const full = path.join(dir, e);
      if (statSync(full).isDirectory()) walkDir(full, out);
      else if (/\.(ts|tsx)$/.test(e)) out.push(full);
    }
    return out;
  };
  it('outside lib/server and tests, no source file defines literal remedy / offering / house6 / house2 data or imports the notes module', () => {
    const offenders: string[] = [];
    for (const dir of ['app', 'components', 'content', 'lib']) {
      for (const f of walkDir(path.join(ROOT, dir))) {
        const rel = path.relative(ROOT, f).split(path.sep).join('/');
        if (rel.startsWith('lib/server/') || /\.test\.tsx?$/.test(rel) || rel.includes('__tests__/')) continue;
        const src = readFileSync(f, 'utf8');
        // a protected field given a literal value (string, template or object), or an import of the notes module
        if (/\b(remedy|offering|house6|house2)\s*:\s*['"`{]/.test(src) || /from\s+['"][^'"]*starNotes['"]/.test(src)) offenders.push(rel);
      }
    }
    // the reader is a Server Component behind the book access gate and the only page that may import the notes
    expect(offenders.sort()).toEqual(['app/books/[id]/read/page.tsx']);
  });
});
