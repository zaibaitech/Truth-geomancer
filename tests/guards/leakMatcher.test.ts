// Stage 1a guard: the fingerprint matcher itself, plus sanity checks on the
// protected / free fixtures, so a broken matcher cannot make every other
// guard pass vacuously.
import { describe, expect, it } from 'vitest';
import { buildFingerprints, findHits, normalizeHtml, normalizeText, stringLiteralsInSource } from './lib/leakMatcher';
import { checkBuildRatchet, type ScanResult } from './lib/buildScan';
import { PROTECTED_GROUPS, protectedStrings } from '../fixtures/protectedContent';
import { publicCorpus } from '../fixtures/publicContentAllowlist';

const SECRET =
  'When the seeker casts this figure in the sixth house, they should give white kola nuts and a hen to an elderly woman on a Friday morning.';
const FREE = 'This figure is called the road and belongs to the element of water, which is mentioned on the public explainer page.';

const fps = buildFingerprints(
  [
    { group: 'test-secret', source: 'synthetic', text: SECRET },
    { group: 'test-free', source: 'synthetic', text: FREE },
    { group: 'test-ident', source: 'synthetic', text: 'own-house-in-life-method-1-identifier' },
    { group: 'test-exact', source: 'synthetic', text: 'starId:"x",variable:[1,2,3]', exact: true },
  ],
  [FREE],
);

describe('leak matcher', () => {
  it('drops strings that are in the free corpus and bare identifiers', () => {
    expect(fps.map((f) => f.group).sort()).toEqual(['test-exact', 'test-secret']);
  });

  it('finds protected text in a minified JS chunk (escaped quotes)', () => {
    const chunk = `self.__x=[{house6:"${SECRET.replace(/"/g, '\\"')}"}];`;
    expect(findHits(normalizeText(chunk), fps).map((h) => h.group)).toEqual(['test-secret']);
  });

  it('finds protected text in an RSC / JSON payload with \\u escapes and \\n', () => {
    const payload = JSON.stringify({ t: SECRET.replace('Friday', 'Fri\nday').replace(' a hen', ' a\u00a0hen') })
      .replace(/\u00a0/g, '\\u00a0')
      .replace('Fri\\nday', 'Friday');
    expect(findHits(normalizeText(payload), fps).map((h) => h.group)).toContain('test-secret');
  });

  it('finds protected text in server HTML split by inline tags and entities', () => {
    const html = `<p>${SECRET.replace('white kola nuts', '<strong>white kola nuts</strong>').replace('elderly', '&#x27;elderly&#x27;')}</p>`;
    const hay = normalizeHtml(html.replace('&#x27;elderly&#x27;', 'elderly'));
    expect(findHits(hay, fps).map((h) => h.group)).toEqual(['test-secret']);
    expect(normalizeHtml('<p>kola &amp; hen&nbsp;today</p>')).toBe('kola & hen today');
  });

  it('matches **markdown bold** in source against plain rendered text', () => {
    const md = buildFingerprints([{ group: 'g', source: 's', text: `**Remedy:** ${SECRET}` }], []);
    expect(findHits(normalizeHtml(`<p><b>Remedy:</b> ${SECRET}</p>`), md)).toHaveLength(1);
  });

  it('finds a partial copy (only the middle of a long protected passage)', () => {
    const middle = SECRET.slice(30, 110);
    expect(findHits(normalizeText(`x="${middle}"`), fps).map((h) => h.group)).toEqual(['test-secret']);
  });

  it('matches structured exact tokens (Hatim triplet shape)', () => {
    expect(findHits(normalizeText('a=[{starId:"x",variable:[1,2,3]}]'), fps).map((h) => h.group)).toEqual(['test-exact']);
  });

  it('does not flag unrelated text', () => {
    expect(findHits(normalizeText('Welcome to the library. Cast a chart to begin.'), fps)).toEqual([]);
  });

  it('ids are stable and contain no protected text', () => {
    const again = buildFingerprints([{ group: 'test-secret', source: 'x', text: SECRET }], []);
    const secret = fps.find((f) => f.group === 'test-secret')!;
    expect(again[0].id).toBe(secret.id);
    expect(secret.id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('extracts string literals from TS source, ignoring comments and templates with expressions', () => {
    const src = `// "commented out string that is long enough"\nconst a = "a literal that is long enough to count";\nconst b = \`tpl \${x} long enough to be ignored here\`;`;
    expect(stringLiteralsInSource(src)).toEqual(['a literal that is long enough to count']);
  });
});

describe('build ratchet logic', () => {
  const base = { g: { ids: ['a', 'b'] } };
  const result = (ids: string[], routes = ['/raml']): ScanResult => ({
    scannedFiles: 1,
    fingerprints: 1,
    hits: ids.map((id) => ({ id, group: 'g', source: 's', label: 'l', file: 'f.js', routes })),
    distinctByGroup: { g: ids.length },
    ids: { g: ids },
  });
  it('passes when findings equal the baseline', () => expect(checkBuildRatchet(result(['a', 'b']), base).ok).toBe(true));
  it('fails on a new leak', () => expect(checkBuildRatchet(result(['a', 'b', 'c']), base).added).toEqual({ g: ['c'] }));
  it('fails when a fixed leak is still in the baseline (baseline must shrink)', () =>
    expect(checkBuildRatchet(result(['a']), base).fixed).toEqual({ g: ['b'] }));
  it('fails on any hit in a zero-tolerance SEO route, even if baselined', () =>
    expect(checkBuildRatchet(result(['a', 'b'], ['/learn/geomancy']), base).ok).toBe(false));
});

describe('protected / free fixtures', () => {
  const all = buildFingerprints(protectedStrings(), publicCorpus());
  const byGroup = Object.fromEntries(PROTECTED_GROUPS.map((g) => [g, all.filter((f) => f.group === g).length]));

  it.each(PROTECTED_GROUPS)('group %s yields fingerprints (a refactor must not silently empty it)', (g) => {
    expect(byGroup[g]).toBeGreaterThan(0);
  });

  it('covers the full books (Kanzul > 250 passages, engine methods > 500 strings)', () => {
    expect(byGroup['kanzul-text']).toBeGreaterThan(250);
    expect(byGroup['engine-methods']).toBeGreaterThan(500);
    expect(byGroup['hatim-values']).toBe(16);
  });

  it('no free string is ever a fingerprint window', () => {
    const free = publicCorpus().map((s) => normalizeText(s));
    const freeHay = free.join('\u0000');
    const offenders = all.filter((f) => f.windows.some((w) => freeHay.includes(w)));
    expect(offenders.map((o) => o.id)).toEqual([]);
  });
});
