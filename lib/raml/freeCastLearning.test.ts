// Free-cast Phase B: the teaching copy is original, accurate against the app's own
// addition rule, restricted to approved subject matter, and the "Keep learning"
// links appear only for pages that actually exist.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { addPatterns, addRows } from '@/lib/raml/casting';
import { CHAPTER_ONE_ADDITION_STEPS } from '@/content/manuscripts/chapterOneDiagrams';
import { LEARN_COPY, LEARN_LINKS, WORKED_EXAMPLE } from '@/content/public/freeCastLearning';
import { LearnLinks } from '@/components/raml/reading/LearnLinks';

const ROOT = path.resolve(__dirname, '../..');
const copyStrings = (): string[] =>
  Object.values(LEARN_COPY).map((v) => (typeof v === 'function' ? v(1) : v)) as string[];

describe('worked example', () => {
  it('equals the app\'s own addPatterns result', () => {
    expect(addPatterns(WORKED_EXAMPLE.a, WORKED_EXAMPLE.b)).toEqual(WORKED_EXAMPLE.result);
    expect(WORKED_EXAMPLE.result).toEqual([2, 1, 1, 2]);
  });
  it('follows the stated rule row by row: matching rows give two dots, differing rows one', () => {
    WORKED_EXAMPLE.result.forEach((r, i) => {
      expect(r).toBe(WORKED_EXAMPLE.a[i] === WORKED_EXAMPLE.b[i] ? 2 : 1);
      expect(r).toBe(addRows(WORKED_EXAMPLE.a[i], WORKED_EXAMPLE.b[i]));
    });
  });
  it('uses all four row positions and both outcomes, so it teaches both halves of the rule', () => {
    const outcomes = new Set(WORKED_EXAMPLE.result);
    expect(outcomes.size).toBe(2);
  });
  it('is not one of the manuscript\'s own chart-building pairs, in either order', () => {
    const key = (a: readonly number[], b: readonly number[]) => `${a.join('')}|${b.join('')}`;
    const manuscript = new Set<string>();
    for (const s of CHAPTER_ONE_ADDITION_STEPS) {
      manuscript.add(key(s.inputPatterns[0], s.inputPatterns[1]));
      manuscript.add(key(s.inputPatterns[1], s.inputPatterns[0]));
    }
    expect(manuscript.has(key(WORKED_EXAMPLE.a, WORKED_EXAMPLE.b))).toBe(false);
  });
});

describe('copy is original and within the approved subject matter', () => {
  it('shares no six-word run with any manuscript source file', () => {
    const dir = path.join(ROOT, 'content/manuscripts');
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const words = (s: string[]) => s.flatMap(norm);
    const source = readdirSync(dir)
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .map((f) => norm(readFileSync(path.join(dir, f), 'utf8')).join(' '))
      .join(' | ');
    for (const text of copyStrings()) {
      const w = words([text]);
      for (let i = 0; i + 6 <= w.length; i++) {
        expect(source.includes(w.slice(i, i + 6).join(' ')), `"${w.slice(i, i + 6).join(' ')}"`).toBe(false);
      }
    }
  });
  it('makes no claim about figure meanings, house meanings, history, religion or outcomes', () => {
    const banned = /\b(god|allah|prophet|ancient|history|historical|tradition|traditional|medieval|arab|sacred|divine|meaning|means|signif|fortune|lucky|unlucky|destiny|fate|predict|favou?rable|element|planet|zodiac|bless|spirit)/i;
    for (const text of copyStrings()) expect(text, text).not.toMatch(banned);
  });
  it('uses only plain words about dots, rows, figures and houses', () => {
    const joined = copyStrings().join(' ').toLowerCase();
    expect(joined).toContain('row');
    expect(joined).toContain('dot');
  });
});

describe('Keep learning links', () => {
  it('each link is enabled if and only if its destination page file exists', () => {
    for (const l of LEARN_LINKS) {
      expect(l.enabled, `${l.label} -> ${l.pageFile}`).toBe(existsSync(path.join(ROOT, l.pageFile)));
    }
  });
  it('LearnLinks renders exactly the enabled links (those whose pages exist) and no disabled one', () => {
    const html = renderToStaticMarkup(createElement(LearnLinks));
    for (const l of LEARN_LINKS) {
      expect(html.includes(`href="${l.href}"`), l.href).toBe(existsSync(path.join(ROOT, l.pageFile)));
    }
    if (LEARN_LINKS.every((l) => !l.enabled)) expect(html).toBe('');
  });
  it('only ever links to internal paths', () => {
    for (const l of LEARN_LINKS) expect(l.href).toMatch(/^\/[a-z-/]+$/);
  });
});
