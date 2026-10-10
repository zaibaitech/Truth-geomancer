// The paid-star-content scan must itself work: it has to FIND the data in every serialisation a bundle can use,
// and flag the field markers even when the wording is new. Uses synthetic build directories only.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { scanStarContent } from './lib/buildScan';
import { STAR_NOTES } from '../../lib/server/content/starNotes';

const dirs: string[] = [];
function fakeBuild(files: Record<string, string>): { next: string; pub: string } {
  const root = mkdtempSync(join(tmpdir(), 'starscan-'));
  dirs.push(root);
  const next = join(root, '.next');
  const pub = join(root, 'public');
  mkdirSync(join(next, 'static', 'chunks'), { recursive: true });
  mkdirSync(join(next, 'server', 'app'), { recursive: true });
  mkdirSync(pub, { recursive: true });
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  }
  return { next, pub };
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const sample = Object.values(STAR_NOTES)[3];

describe('paid star content scan', () => {
  it('passes a clean build and reports its scope', () => {
    const { next, pub } = fakeBuild({ '.next/static/chunks/a.js': 'self.x=function(){return "hello"}', 'public/sw.js': 'console.log(1)' });
    const r = scanStarContent(next, pub);
    expect(r.hits).toEqual([]);
    expect(r.scope.staticJs).toBe(1);
    expect(r.scope.publicFiles).toBe(1);
  });

  it.each([
    ['verbatim in a minified chunk', (s: string) => `var a=${JSON.stringify(s)};`],
    ['inside a single-quoted string with escaped quotes', (s: string) => `var a='${s.replace(/'/g, "\\'")}';`],
    ['JSON-escaped in a flight (RSC) payload', (s: string) => `1:{"t":${JSON.stringify(JSON.stringify({ x: s }))}}`],
    ['HTML-escaped in prerendered markup', (s: string) => `<p>${s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}</p>`],
    ['unicode-escaped', (s: string) => `var a="${s.replace(/[\u0080-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)}";`],
  ])('finds a remedy %s', (_name, wrap) => {
    for (const target of [sample.house6.remedy, sample.house2.remedy, sample.sadaqah.offering]) {
      const { next, pub } = fakeBuild({ '.next/static/chunks/782-test.js': wrap(target) });
      const r = scanStarContent(next, pub);
      expect(r.hits.some((h) => h.kind === 'string'), `string hit for ${target.length}-char value`).toBe(true);
    }
  });

  it.each(['{remedy:"x"}', '{"remedy":"x"}', '{\\"remedy\\":\\"x\\"}', '{offering:"x"}', '{"offering": "x"}', '{house6:{meaning:"x"}}', 'o["remedy"]=1'])(
    'flags the field marker in %s even when the wording is new',
    (body) => {
      const { next, pub } = fakeBuild({ '.next/static/chunks/m.js': body });
      expect(scanStarContent(next, pub).hits.some((h) => h.kind === 'marker')).toBe(true);
    },
  );

  it('scans every generated JS file, prerendered page and public file, not a single known chunk', () => {
    for (const where of ['.next/static/chunks/app/raml/page-1.js', '.next/static/chunks/pages/x.js', '.next/static/chunks/zzz.js', '.next/server/app/raml.html', '.next/server/app/books/x.rsc', 'public/sw.js']) {
      const { next, pub } = fakeBuild({ [where]: `{"remedy":"x"}` });
      const r = scanStarContent(next, pub);
      expect(r.hits.map((h) => h.file), where).toHaveLength(1);
    }
  });

  it('never puts protected text in its report', () => {
    const { next, pub } = fakeBuild({ '.next/static/chunks/a.js': JSON.stringify(sample.house6.remedy) });
    const report = JSON.stringify(scanStarContent(next, pub));
    expect(report.includes(sample.house6.remedy)).toBe(false);
  });
});
