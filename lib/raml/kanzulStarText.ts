// Presentation helper for the Kanzul Mikban reader: finds the canonical star
// names (content/stars.ts `STARS[].name`) in a paragraph so the reader can draw
// each named star's figure beside its name. It reads STARS and changes nothing —
// the figure shown for a name is always that star's own canonical pattern.
//
// Only a star's canonical name is matched ("Kalla Allahu", "Hassan & Hussein",
// ...). Spelling variants the book also uses ("Kallah Allahu", "Yusuf",
// "Osman/Uthman") are left as plain text rather than guessed at.
//
// No lookbehind: older iOS Safari throws a SyntaxError on it at load time.
import { STARS } from '@/content/stars';

export type StarTextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'star'; text: string; starId: string };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Longest names first, so a name that contains another is matched whole.
const NAME_ALTERNATION = [...STARS]
  .sort((a, b) => b.name.length - a.name.length)
  .map((s) => escapeRe(s.name))
  .join('|');

const STAR_ID_BY_NAME = new Map(STARS.map((s) => [s.name, s.id]));

/** Split `text` into plain text and canonical star names, in order. The
 * segments always concatenate back to exactly `text`. */
export function splitStarNames(text: string): StarTextSegment[] {
  const re = new RegExp(`(^|[^A-Za-z])(${NAME_ALTERNATION})(?![A-Za-z])`, 'g');
  const out: StarTextSegment[] = [];
  let cursor = 0;
  for (const m of Array.from(text.matchAll(re))) {
    const nameStart = (m.index ?? 0) + m[1].length;
    if (nameStart > cursor) out.push({ kind: 'text', text: text.slice(cursor, nameStart) });
    out.push({ kind: 'star', text: m[2], starId: STAR_ID_BY_NAME.get(m[2])! });
    cursor = nameStart + m[2].length;
  }
  if (cursor < text.length) out.push({ kind: 'text', text: text.slice(cursor) });
  return out;
}

/** Canonical star names the edition prints as plain words, with NO figure of
 * their own beside them, so the reader must not draw one: a name inside an
 * editorial note (chapters 10 and 79: "written as 'Musah' in the original"), a
 * name used only in a description of a diagram (chapter 46: "Star (3) Mahadi"),
 * and chapter 121, where the edition WRITES "Adam" next to a figure that is
 * Usman's (⟦usman⟧ follows it) — the written name and the drawn figure are both
 * shown exactly as printed, and neither is "corrected". Keyed by entry id. */
export const KANZUL_PLAIN_STAR_NAMES: Readonly<Record<string, ReadonlySet<string>>> = {
  'if-your-lost-thing-is-still-around-or': new Set(['Musah']), // ch.10
  'the-number-of-babies-in-a-pregnancy': new Set(['Musah']), // ch.79
  'how-to-make-one-win-over-the-other': new Set(['Mahadi']), // ch.46
  'if-you-will-get-knowledge-or-not-in': new Set(['Adam']), // ch.121 (source_contradiction)
};

/** A figure the edition prints on its own, with no canonical name beside it in
 * the text (or beside a different name — an alias, or a printed name that
 * disagrees with the figure). Stored in the chapter text as ⟦star-id⟧ and drawn
 * as the bare figure, never replaced by a name chip. */
export type FigureTextSegment = StarTextSegment | { kind: 'glyph'; starId: string };

const GLYPH_MARKUP = /⟦([a-z-]+)⟧/g;

/** Split a paragraph into plain text, canonical star names and bare-figure
 * markup, in order. The segments' text, with ⟦…⟧ left as written, always
 * reproduces the paragraph. */
export function splitFigureText(text: string): FigureTextSegment[] {
  const out: FigureTextSegment[] = [];
  let cursor = 0;
  for (const m of Array.from(text.matchAll(GLYPH_MARKUP))) {
    const at = m.index ?? 0;
    if (at > cursor) out.push(...splitStarNames(text.slice(cursor, at)));
    out.push({ kind: 'glyph', starId: m[1] });
    cursor = at + m[0].length;
  }
  if (cursor < text.length) out.push(...splitStarNames(text.slice(cursor)));
  return out;
}

/** Entries whose text continues in the NEXT entry of the edition (the book itself
 * splits the passage across two headings), so a cut-off marker at the end of the
 * first part is not a missing-source notice. */
export const KANZUL_ENTRIES_CONTINUED_IN_NEXT_ENTRY: ReadonlySet<string> = new Set(['continued-from-chapter-twenty-eight']);

/** Chapter 106 prints a two-column table: "1. Head — <figure>   10. Right thigh —
 * <figure>" and so on. The paragraph stores it as one run of text; this reads it
 * back into rows, in the order printed, WITHOUT changing a word or a figure
 * (including the printed anomalies). Returns null if the text is not that table. */
export const KANZUL_BODY_PART_TABLE_ENTRY_ID = 'parts-of-the-human-body-and-the-stars';

export interface BodyPartRow { n: number; label: string; starId: string | null }

export function parseBodyPartTable(text: string): BodyPartRow[] | null {
  const marks = Array.from(text.matchAll(/(?:^|\s)(\d{1,2})\.\s+/g));
  if (marks.length !== 16) return null;
  const rows: BodyPartRow[] = marks.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < marks.length ? (marks[i + 1].index ?? text.length) : text.length;
    const segs = splitStarNames(text.slice(start, end));
    const star = segs.find((s) => s.kind === 'star') as { starId: string } | undefined;
    const label = segs.filter((s) => s.kind === 'text').map((s) => s.text).join(' ').replace(/[—\s]+$/g, '').replace(/\s*—\s*$/, '').replace(/\s+/g, ' ').trim();
    return { n: Number(m[1]), label, starId: star?.starId ?? null };
  });
  return rows;
}
