// The Kanzul reader shows each canonical star name with that star's own figure.
// These tests render the REAL reader component to HTML and check that (a) no
// internal restoration/audit wording reaches a customer, (b) every figure drawn
// is exactly the canonical STARS pattern for the name beside it, (c) the text
// itself is untouched, and (d) the chapters the task named (5, 6 and the other
// named-star lists) really display figures.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { STARS } from '@/content/stars';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { ChapterMethodPractice } from '@/components/books/ChapterMethodPractice';
import { KANZUL_PLAIN_STAR_NAMES, parseBodyPartTable, splitStarNames } from './kanzulStarText';

const chapter = (n: number) => KM_CHAPTERS.find((c) => c.number === n)!;
const render = (c: (typeof KM_CHAPTERS)[number]) =>
  renderToStaticMarkup(createElement(ChapterMethodPractice, { chapterId: c.id, paragraphs: c.paragraphs }));
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const textOf = (html: string) => decode(html.replace(/<[^>]+>/g, ''));
/** [starId, pattern shown beside it] for every figure chip, in order. */
const chips = (html: string) =>
  Array.from(html.matchAll(/data-star-figure="([a-z-]+)".*?aria-label="Figure pattern ([\d-]+)"/g)).map((m) => [m[1], m[2]] as const);
const canonical = (id: string) => STARS.find((s) => s.id === id)!.pattern.join('-');

describe('no restoration / audit wording is shown to customers', () => {
  const FORBIDDEN = /figures restored|restored from|shown by name|manuscript scan|reconstructed|audit/i;
  it('no chapter paragraph or title contains it (all 153 entries)', () => {
    expect(KM_CHAPTERS.length).toBe(153);
    for (const c of KM_CHAPTERS) {
      expect(c.title, `title of ch.${c.number}`).not.toMatch(FORBIDDEN);
      for (const p of c.paragraphs) expect(p, `ch.${c.number}`).not.toMatch(FORBIDDEN);
    }
  });

  it('chapters 5 and 6 read cleanly, with the figures still listed by name', () => {
    expect(chapter(5).paragraphs.join(' ')).toContain('it means you will win it: Kalla Allahu, Ayuba, Musah, Mahadi, Adam, Ibrahim, Yunus. If you found');
    expect(chapter(5).paragraphs.join(' ')).toContain('They are as follows: Hassan & Hussein, Issah, Yunus, Ayuba.');
    expect(chapter(6).paragraphs.join(' ')).toContain('opened land or desert: Musah, Adam, Iddris, Ayuba.');
  });
});

describe('splitStarNames', () => {
  it('reproduces any text exactly when its segments are joined back', () => {
    for (const c of KM_CHAPTERS) for (const p of c.paragraphs) expect(splitStarNames(p).map((s) => s.text).join('')).toBe(p);
  });

  it('matches canonical names whole, including the two-word and ampersand names, in order', () => {
    const segs = splitStarNames('If you see Kalla Allahu, Hassan & Hussein or Ali, then Alibaba and Kallah Allahu stay text.');
    expect(segs.filter((s) => s.kind === 'star').map((s) => (s as { starId: string }).starId)).toEqual(['kalla-allahu', 'hassan-hussein', 'ali']);
  });

  it('every star it returns resolves to a STARS id whose name is the matched text', () => {
    for (const c of KM_CHAPTERS) for (const p of c.paragraphs) for (const s of splitStarNames(p)) {
      if (s.kind === 'star') expect(STARS.find((x) => x.id === s.starId)!.name).toBe(s.text);
    }
  });
});

describe('the reader draws the canonical figure beside each named star', () => {
  it('chapter 5: the h6 list and the h1/h8 list are drawn, in source order, each with its STARS pattern', () => {
    const shown = chips(render(chapter(5))).map(([id]) => id);
    expect(shown).toEqual([
      'kalla-allahu', 'ayuba', 'musah', 'mahadi', 'adam', 'ibrahim', 'yunus', // h6
      'hassan-hussein', 'issah', 'yunus', 'ayuba', // h1 / h8
    ]);
    for (const [id, pattern] of chips(render(chapter(5)))) expect(pattern, id).toBe(canonical(id));
    expect(chips(render(chapter(5))).find(([id]) => id === 'kalla-allahu')![1]).toBe('1-1-2-2');
  });

  it('chapter 6: Musah, Adam, Iddris, Ayuba with their STARS patterns', () => {
    const shown = chips(render(chapter(6)));
    expect(shown.map(([id]) => id)).toEqual(['musah', 'adam', 'iddris', 'ayuba']);
    expect(shown.map(([, p]) => p)).toEqual(['2-2-2-2', '1-2-2-2', '2-2-1-2', '2-2-2-1']);
  });

  it('the name stays visible and the paragraph text is unchanged (figures only added)', () => {
    for (const n of [5, 6, 9, 17, 27, 94, 97, 142]) {
      const c = chapter(n);
      // "Try this method" is the reader's own link, not chapter text.
      expect(textOf(render(c)).replace(/Try this method/g, '').replace(/\s+/g, '')).toBe(c.paragraphs.join('').replace(/\s+/g, ''));
    }
  });

  it('every chapter with named stars shows one figure per name (except names the edition prints without a figure), each equal to its canonical pattern', () => {
    let withStars = 0;
    for (const c of KM_CHAPTERS) {
      const plain = KANZUL_PLAIN_STAR_NAMES[c.id];
      const expected = c.paragraphs.flatMap((p) => splitStarNames(p).filter((s) => s.kind === 'star' && !plain?.has(s.text)));
      const drawn = chips(render(c));
      expect(drawn.length, `ch.${c.number}`).toBe(expected.length);
      for (const [id, pattern] of drawn) expect(pattern, `ch.${c.number} ${id}`).toBe(canonical(id));
      if (expected.length) withStars++;
    }
    expect(withStars).toBeGreaterThanOrEqual(30);
  });

  it('never nests a <div> inside a <p> (that makes the browser split the paragraph)', () => {
    for (const c of KM_CHAPTERS) expect(/<p[ >](?:(?!<\/p>)[\s\S])*<div/.test(render(c)), `ch.${c.number}`).toBe(false);
  });

  it('chapter 121 (source contradiction) shows what the edition prints: the written name Adam, then the figure drawn beside it (Usman\'s), and Ali with its own', () => {
    const c = KM_CHAPTERS.find((x) => x.number === 121)!;
    const html = render(c);
    expect(c.paragraphs.join(' ')).toContain('Adam ⟦usman⟧');
    expect(textOf(html)).toContain('Adam');
    expect(chips(html).map(([id]) => id)).toEqual(['ali']); // Adam is plain text, Ali is a name chip
    const bare = Array.from(html.matchAll(/data-bare-figure="([a-z-]+)".*?aria-label="Figure pattern ([\d-]+)"/g)).map((m) => [m[1], m[2]]);
    expect(bare).toEqual([['usman', canonical('usman')]]);
  });

  it('drawn dots are the canonical pattern: row counts match STARS for all sixteen figures', () => {
    const html = renderToStaticMarkup(
      createElement(ChapterMethodPractice, { chapterId: 'x', paragraphs: [STARS.map((s) => s.name).join(', ')] }),
    );
    const shown = chips(html);
    expect(shown.map(([id]) => id).sort()).toEqual(STARS.map((s) => s.id).sort());
    for (const [id, p] of shown) expect(p).toBe(canonical(id));
  });
});

describe('chapter 106 body-part table', () => {
  const c = KM_CHAPTERS.find((x) => x.number === 106)!;
  const rows = parseBodyPartTable(c.paragraphs.join(' '))!;

  it("reads back as the edition's table, in printed order, with the printed anomalies untouched", () => {
    expect(rows.map((r) => r.n)).toEqual([1, 10, 2, 11, 3, 12, 4, 13, 5, 14, 6, 15, 7, 16, 8, 9]);
    expect(rows.map((r) => r.starId)).toEqual([
      'sulemana', 'issah', 'sulemana', 'usman', 'iddris', 'mahadi', 'kalla-allahu', 'hassan-hussein',
      'nuhu', 'umar', 'yussif', 'ibrahim', 'yunus', 'ayuba', 'ali', 'musah',
    ]); // Sulemana for BOTH Head and Neck, Adam never — as printed
    expect(rows.map((r) => r.label).slice(0, 4)).toEqual(['Head', 'Right thigh', 'Neck', 'Left thigh']);
    expect(rows[15].label).toBe('Backbone (Back)');
  });

  it('renders as a two-column list, one figure per part, each its canonical pattern', () => {
    const html = render(c);
    expect(html).toContain('grid-cols-2');
    const shown = chips(html);
    expect(shown.map(([id]) => id)).toEqual(rows.map((r) => r.starId));
    for (const [id, pattern] of shown) expect(pattern).toBe(canonical(id));
  });
});
