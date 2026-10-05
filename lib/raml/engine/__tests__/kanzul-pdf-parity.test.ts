// PDF-to-app parity for Kanzul Mikban. The authoritative edition
// (docs/Kanzul-Mikban-Final-Edition.pdf) draws every geomantic figure as an
// embedded image, which text extraction drops, so the comparison data is
// generated from the PDF's real page structure by scripts/kanzul_pdf_parity.py
// (figure images decoded to dot patterns and matched to STARS by exact pattern
// equality; headings, page numbers and text in reading order). This test proves,
// for EVERY entry of the book, that the app carries the same words, the same
// figures in the same order, the same headings and the same numbering.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { STARS } from '@/content/stars';
import { getDreamInterpretationStarId } from '@/content/manuscripts/dreamInterpretations';
import { getGiftVisitorFigureStarId } from '@/content/manuscripts/giftVisitorFigures';
import { KM_CHAPTERS, KM_FRONT_MATTER, KM_OPENING_INVOCATION, KM_TITLE_PAGE } from '@/lib/server/content/kanzulMikban';
import { ChapterMethodPractice } from '@/components/books/ChapterMethodPractice';
import { KanzulFrontMatterSections, KanzulTitlePage } from '@/components/books/KanzulFrontMatter';
import { KANZUL_PLAIN_STAR_NAMES, splitFigureText } from '@/lib/raml/kanzulStarText';
import fixture from './kanzulPdfParity.fixture.json';

interface Entry { page: number; number: number | null; title: string; tokens: string; figures: string[] }
const ENTRIES = fixture.entries as Entry[];
const BODY = ENTRIES.slice(1); // entry 0 is the Opening Invocation (KM_OPENING_INVOCATION), not a chapter
const COMPONENT_ENTRIES = new Set(['dreams-and-their-interpretations', 'continued-from-chapter-twenty-eight', 'reading-the-gift-visitor-figures-end-of-chapter']);

const wn = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9&]+/g, '');
const NAME_TOKENS = STARS.map((s) => [s.id, s.name.split(' ').map(wn)] as const).sort((a, b) => b[1].length - a[1].length);

/** Same normalisation as scripts/kanzul_pdf_parity.py, applied to app text: words lower-cased
 * and stripped of punctuation, canonical star names (and ⟦id⟧ figure markup) as S:<id>. */
function appTokens(paragraphs: string[]): string[] {
  const text = paragraphs.join(' ').replace(/⟦([a-z-]+)⟧/g, ' S:$1 ');
  const norm = text.split(/\s+/).map((w) => (w.startsWith('S:') ? w : wn(w))).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < norm.length; ) {
    if (norm[i].startsWith('S:')) { out.push(norm[i]); i++; continue; }
    const hit = NAME_TOKENS.find(([, nt]) => nt.every((t, k) => norm[i + k] === t));
    if (hit) { out.push('S:' + hit[0]); i += hit[1].length; continue; }
    out.push(norm[i]); i++;
  }
  return out;
}

const render = (id: string, paragraphs: string[]) => renderToStaticMarkup(createElement(ChapterMethodPractice, { chapterId: id, paragraphs }));

/** The figures the reader draws for an entry, in order: name chips (except names the edition prints without one) and bare figures. */
function drawnFigures(id: string, paragraphs: string[]): string[] {
  const plain = KANZUL_PLAIN_STAR_NAMES[id];
  return paragraphs.flatMap((p) =>
    splitFigureText(p)
      .filter((s) => s.kind === 'glyph' || (s.kind === 'star' && !plain?.has(s.text)))
      .map((s) => (s as { starId: string }).starId),
  );
}

describe('the PDF fixture itself', () => {
  it('describes the authoritative edition: 116 pages, 16 unique figure images, 154 headings', () => {
    expect(fixture.source.pages).toBe(116);
    expect(fixture.source.figureImages).toBe(16);
    expect(ENTRIES).toHaveLength(154);
  });

  it('every figure in it is one of the 16 canonical STARS ids', () => {
    const ids = new Set(STARS.map((s) => s.id));
    for (const e of ENTRIES) for (const f of e.figures) expect(ids.has(f), `p.${e.page} ${f}`).toBe(true);
    expect(ENTRIES.reduce((n, e) => n + e.figures.length, 0)).toBe(366);
  });
});

describe('chapter order, headings and numbering match the edition', () => {
  it('the app has one entry for every body heading, in the same order', () => {
    expect(KM_CHAPTERS).toHaveLength(BODY.length);
    KM_CHAPTERS.forEach((c, i) => {
      expect(c.number, `entry ${i}: ${c.title}`).toBe(BODY[i].number);
      expect(c.title.replace(/\s+/g, ' '), `entry ${i}`).toBe(BODY[i].title.replace(/\s+/g, ' ').replace(/Twenty- Eight/, 'Twenty-Eight'));
    });
  });

  it('the Opening Invocation, edition notes and glossary are the edition\'s own, verbatim', () => {
    expect(KM_TITLE_PAGE.title).toBe('Kanzul Mikban');
    expect(KM_OPENING_INVOCATION.paragraphs.join(' ')).toBe(fixture.invocationLines.join(' ').replace(/\s+/g, ' '));
    expect(KM_FRONT_MATTER.map((s) => [s.title, s.level, s.paragraphs.join(' ')])).toEqual(
      fixture.frontMatter.map((s) => [s.title, s.level, s.text]),
    );
  });

  it('chapter 11 is the heading the edition prints WITHOUT a chapter number', () => {
    const i = KM_CHAPTERS.findIndex((c) => c.number === 12);
    expect(KM_CHAPTERS[i - 1].number).toBeNull();
    expect(KM_CHAPTERS[i - 1].title).toContain('Successful in Life, at Home');
  });
});

describe('every entry carries the edition\'s words, and every figure, in order', () => {
  it('words and figure positions: identical to the PDF for every entry the reader renders from text', () => {
    let compared = 0;
    KM_CHAPTERS.forEach((c, i) => {
      if (COMPONENT_ENTRIES.has(c.id)) return;
      expect(appTokens(c.paragraphs).join(' '), `ch.${c.number ?? c.title}`).toBe(BODY[i].tokens);
      compared++;
    });
    expect(compared).toBe(150);
  });

  it('figures drawn: exactly the PDF\'s figures, in the PDF\'s order, for every text entry (none omitted, none added)', () => {
    KM_CHAPTERS.forEach((c, i) => {
      if (COMPONENT_ENTRIES.has(c.id)) return;
      expect(drawnFigures(c.id, c.paragraphs), `ch.${c.number ?? c.title}`).toEqual(BODY[i].figures);
    });
  });

  it('the rendered reader draws those same figures (each name chip / bare figure is its canonical STARS pattern)', () => {
    KM_CHAPTERS.forEach((c, i) => {
      if (COMPONENT_ENTRIES.has(c.id)) return;
      const html = render(c.id, c.paragraphs);
      const shown = Array.from(html.matchAll(/data-(?:star|bare)-figure="([a-z-]+)".*?aria-label="Figure pattern ([\d-]+)"/g)).map((m) => [m[1], m[2]]);
      expect(shown.map(([id]) => id), `ch.${c.number ?? c.title}`).toEqual(BODY[i].figures);
      for (const [id, pattern] of shown) expect(pattern).toBe(STARS.find((s) => s.id === id)!.pattern.join('-'));
    });
  });

  it('the three entries the reader draws with dedicated components: words match, and their figures are the edition\'s, in order', () => {
    const textOnly = (t: string) => t.split(' ').filter((x) => !x.startsWith('S:')).join(' ');
    KM_CHAPTERS.forEach((c, i) => {
      if (!COMPONENT_ENTRIES.has(c.id)) return;
      expect(textOnly(appTokens(c.paragraphs).join(' ')), c.id).toBe(textOnly(BODY[i].tokens));
    });
    const at = (id: string) => BODY[KM_CHAPTERS.findIndex((c) => c.id === id)].figures;
    expect(at('dreams-and-their-interpretations')).toEqual(Array.from({ length: 16 }, (_, k) => getDreamInterpretationStarId(k + 1)));
    expect([...at('continued-from-chapter-twenty-eight'), ...at('reading-the-gift-visitor-figures-end-of-chapter')]).toEqual(
      Array.from({ length: 8 }, (_, k) => getGiftVisitorFigureStarId(k + 1)),
    );
  });
});

describe('the reader shows the edition\'s front matter and invocation before Chapter One', () => {
  const html = renderToStaticMarkup(
    createElement('div', null, createElement(KanzulTitlePage, { ...KM_TITLE_PAGE }), createElement(KanzulFrontMatterSections, { sections: [...KM_FRONT_MATTER, KM_OPENING_INVOCATION] })),
  );
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

  it('renders every heading and every paragraph of the edition\'s notes, glossary and Opening Invocation', () => {
    for (const s of [...KM_FRONT_MATTER, KM_OPENING_INVOCATION]) {
      expect(text, s.title).toContain(s.title);
      for (const p of s.paragraphs) expect(text, s.title).toContain(p.slice(0, 60));
    }
    expect(text).toContain('A Manual of Geomancy (‘Ilm al-Raml)');
    expect(text).toContain('Transcribed and Compiled Edition');
    expect(text).toContain('In the name of Allah, the Most Gracious, the Most Merciful.');
  });

  it("draws the edition's own page-3 example figure (even, odd, odd, even) from STARS", () => {
    expect(html).toContain('data-example-figure="ali"');
    expect(html).toContain('aria-label="Figure pattern 2-1-1-2"');
    expect(STARS.find((s) => s.id === 'ali')!.pattern).toEqual([2, 1, 1, 2]);
  });
});
