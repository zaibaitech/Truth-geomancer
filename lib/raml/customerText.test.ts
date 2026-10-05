// Customer-facing Kanzul wording: internal transcription / review markers are
// hidden, legitimate edition wording about the manuscript is kept, and nothing
// is invented to fill a gap.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KM_CHAPTERS, KM_EDITION_NOTE } from '@/lib/server/content/kanzulMikban';
import { ChapterMethodPractice } from '@/components/books/ChapterMethodPractice';
import { SOURCE_INCOMPLETE_NOTICE, cleanSourceText, customerReviewNote, customerSafeInterpretation } from './customerText';

const INTERNAL_MARKER = /\[figures omitted|not yet transcribed|see original scan|not preserved in this transcription/i;
const INTERNAL_WORDING = /restor|shown by name|manuscript scan|final edition|author confirmation|audit|not yet|figures omitted/i;
const render = (c: (typeof KM_CHAPTERS)[number]) =>
  renderToStaticMarkup(createElement(ChapterMethodPractice, { chapterId: c.id, paragraphs: c.paragraphs }));
const textOf = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
const chapter = (n: number) => KM_CHAPTERS.find((c) => c.number === n)!;

describe('cleanSourceText', () => {
  it('removes each internal marker and tidies the gap, leaving the surrounding words alone', () => {
    const a = cleanSourceText('If you see [figures omitted — symbols not preserved in this transcription] it means a lady.');
    expect(a).toEqual({ text: 'If you see it means a lady.', removedMarker: true });
    const b = cleanSourceText('She will come, or... [text continues onto the next page, not yet transcribed]');
    expect(b.text).toBe('She will come, or...');
    expect(b.removedMarker).toBe(true);
    expect(cleanSourceText('inside Star (3) Mahadi [talismanic diagram in the original — not reproduced here; see original scan].').text).toBe(
      'inside Star (3) Mahadi.',
    );
    expect(cleanSourceText('[Note: text continues onto the next page, not yet transcribed]').text).toBe('');
  });

  it("leaves legitimate edition wording about the manuscript untouched", () => {
    for (const t of ['[unclear in the original]', '[quantity/term unclear in the original]', '[written as "Musah" in the original — term unclear]', '[too close to call]']) {
      expect(cleanSourceText(`word ${t} word`)).toEqual({ text: `word ${t} word`, removedMarker: false });
    }
  });

  it('invents nothing: text without a marker is returned exactly as given', () => {
    for (const c of KM_CHAPTERS) for (const p of c.paragraphs) if (!INTERNAL_MARKER.test(p)) expect(cleanSourceText(p).text).toBe(p);
  });
});

describe('review notes and interpretation sentences', () => {
  it('a withheld method gets the one neutral line; no note stays no note', () => {
    expect(customerReviewNote('The final edition supplies the figures but …')).toBe(SOURCE_INCOMPLETE_NOTICE);
    expect(customerReviewNote(null)).toBeNull();
  });

  it("the embedded note in the engine's interpretation sentence is replaced too", () => {
    const raw = 'Method 4 is not included in this reading (The final edition supplies … author).';
    expect(customerSafeInterpretation(raw, [['The final edition supplies … author', SOURCE_INCOMPLETE_NOTICE]])).toBe(
      `Method 4 is not included in this reading (${SOURCE_INCOMPLETE_NOTICE}).`,
    );
  });
});

describe('what a customer reads in the Kanzul chapters (all 153 entries)', () => {
  it('no chapter shows an internal marker once cleaned, and none shows restoration/audit wording', () => {
    expect(KM_CHAPTERS).toHaveLength(153);
    for (const c of KM_CHAPTERS) for (const p of c.paragraphs) {
      const shown = cleanSourceText(p).text;
      expect(shown, `ch.${c.number}`).not.toMatch(INTERNAL_MARKER);
      expect(shown, `ch.${c.number}`).not.toMatch(INTERNAL_WORDING);
    }
  });

  it('the rendered reader HTML matches: no marker and no internal wording in any chapter', () => {
    for (const c of KM_CHAPTERS) {
      const shown = textOf(render(c));
      expect(shown, `ch.${c.number}`).not.toMatch(INTERNAL_MARKER);
      expect(shown, `ch.${c.number}`).not.toMatch(INTERNAL_WORDING);
    }
  });

  it('the notice appears only where the edition itself cuts off or omits a diagram (ch.46, the pregnancy methods, ch.82), never where it merely continues in the next entry', () => {
    const withNotice = KM_CHAPTERS.filter((c) => textOf(render(c)).includes(SOURCE_INCOMPLETE_NOTICE)).map((c) => c.id);
    expect(withNotice.sort()).toEqual(
      ['how-to-make-one-win-over-the-other', 's-if-you-want-to-know-if-she', 'the-time-she-will-put-to-bed'].sort(),
    );
  });

  it('every figure list the edition prints is now in the app text: no placeholder remains anywhere', () => {
    for (const c of KM_CHAPTERS) for (const p of c.paragraphs) expect(p, `ch.${c.number}`).not.toContain('[figures omitted');
  });

  it('chapters 2, 7, 13, 18, 26, 29, 42, 49, 60, 61, 95 and the restored chapters show their figure lists and no notice', () => {
    for (const n of [2, 4, 5, 6, 7, 9, 13, 17, 18, 19, 21, 26, 27, 29, 36, 42, 49, 60, 61, 94, 95, 97, 102, 124, 132, 142]) {
      expect(textOf(render(chapter(n))), `ch.${n}`).not.toContain(SOURCE_INCOMPLETE_NOTICE);
    }
  });

  it('legitimate wording about the manuscript itself is kept', () => {
    const all = KM_CHAPTERS.flatMap((c) => c.paragraphs).join(' ');
    expect(all).toContain('unclear in the original');
    expect(all).toContain('runs off the edge of the scanned page');
    expect(KM_EDITION_NOTE.join(' ')).toContain('reconstructed from hand-drawn manuscript photographs');
  });
});
