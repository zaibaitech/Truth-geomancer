// Generic parser that turns a Kanzul Mikban "Method N: ..." paragraph into a
// structured ParsedMethod the app can evaluate automatically against a real
// chart — extending the flagship chapter's hand-authored treatment
// (methodVerdicts.ts) to as much of the rest of the book as can be parsed
// with real confidence, rather than guessed at.
//
// Scope, deliberately conservative: a method only parses if (a) its
// instruction is a plain "pick/check these houses" — not an element-isolation
// or dot-counting technique, both of which use a different mechanic this
// parser doesn't attempt — and (b) its outcome text resolves to one
// recognized axis (see Axis below) with every branch the text describes
// captured by regex, not partially guessed. Everything else — embedded
// hand-drawn figures the source couldn't transcribe, whole-chart tallies
// ("count all the good stars..."), multi-house comparisons without a single
// combined figure, incomplete/truncated source text — is left alone, and
// falls back to the plain house-chip display already in ReadingTab. A method
// that DOES parse but whose computed result lands on a combination the
// source text never actually addresses (e.g. a "level" figure on an
// upward/downward-only method) still shows every mechanical fact plainly,
// with an honest note that the book's own wording doesn't cover it, rather
// than forcing a guess.

// PROMPT 27B NOTE: relocated from lib/raml/ to lib/server/raml/ — this
// module genuinely parses every KM chapter's full paragraph text to
// auto-derive verdicts (getParsedMethods, below, iterates the whole
// corpus on first call), which is exactly why it can no longer live
// anywhere a client component can reach it. Prompt 27 left it in
// lib/raml/ as a documented residual exposure (the full Kanzul Mikban
// corpus was still entering the client bundle via ReadingTab.tsx →
// methodVerdicts.ts → here); Prompt 27B closes that by moving this file
// (unchanged logic — a pure relocation, verified byte-for-byte identical
// output via lib/raml/readingVerdictsEquivalence.test.ts) behind the
// server boundary and having lib/server/readingVerdictService.ts call it
// from a Route Handler instead. The browser now only ever receives the
// trimmed per-request result — never this module, never KM_CHAPTERS.
import type { KmChapter } from '@/lib/server/content/kanzulMikban';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';

export type Axis =
  | { kind: 'updown' }
  | { kind: 'fortune' }
  | { kind: 'fortuneUpdown' }
  | { kind: 'element' }
  | { kind: 'foundInChart' }
  | { kind: 'fortuneFoundInChart' }
  | { kind: 'updownFoundInChart' }
  | { kind: 'elementOpenedClosed'; element: 'fire' | 'air' | 'water' | 'sand' }
  | { kind: 'namedStar' };

export interface ParsedOutcome {
  match: string; // a computed key this outcome applies to, e.g. "upward", "good|downward", "found"
  text: string;
}

export interface ParsedMethod {
  chapterId: string;
  label: string; // "Method 1"
  sourceText: string;
  houses: number[]; // for namedStar this is per-outcome instead, see namedStarHouse below
  axis: Axis;
  outcomes: ParsedOutcome[];
  namedStarHouse?: Record<string, number>; // outcome match -> house number, namedStar axis only
}

const SUBJ = "(?:it'?s|you get|your result is|it is)";

function multiKeywordRe(keywords: string[], noun = 'star', requireNoun = true) {
  const kw = keywords.join('|');
  const nounPart = requireNoun ? `\\s+${noun}` : `(?:\\s+${noun})?`;
  return new RegExp(
    `if\\s+${SUBJ}\\s+(?:an?\\s+)?((?:(?:${kw})(?:\\s*,?\\s*(?:or|and)\\s*)?)+)${nounPart},?\\s*(?:it means\\s*)?([^.;]+?)[.;]`,
    'gi'
  );
}

const UPDOWN_KW = ['upward', 'downward'];
const FORTUNE_KW = ['middle-good', 'good', 'bad']; // longest first so "good" doesn't shadow "middle-good"
const ELEMENT_KW = ['fire', 'air', 'water', 'sand'];

const FU_RE = new RegExp(
  `if\\s+${SUBJ}\\s+(?:an?\\s+)?(good|bad)\\s+and\\s+(upward|downward)\\s+star,?\\s*(?:it means\\s*)?([^.;]+?)[.;]`,
  'gi'
);
const UD_RE = multiKeywordRe(UPDOWN_KW);
const FT_RE = multiKeywordRe(FORTUNE_KW);
const EL_RE = multiKeywordRe(ELEMENT_KW);

const FOUND_POS_RE = new RegExp(`if\\s+${SUBJ}\\s+(?:also\\s+)?found\\s+in\\s+the\\s+chart,?\\s*(?:it means\\s*)?([^.;]+?)[.;]`, 'i');
const FOUND_NEG_RE = new RegExp(`if\\s+${SUBJ}\\s+not\\s+(?:found\\s+)?in\\s+the\\s+chart(?:\\s+at\\s+all)?,?\\s*(?:it means\\s*)?([^.;]+?)[.;]`, 'i');
const FOUND_NEG_RE2 = new RegExp(`if\\s+${SUBJ}\\s+not\\s+found,?\\s*(?:it means\\s*)?([^.;]+?)[.;]`, 'i');

const FT_FOUND_RE = new RegExp(
  `if\\s+${SUBJ}\\s+(?:an?\\s+)?(good|bad)\\s+star\\s+(?:and(?:\\s+it'?s)?(?:\\s+also)?|but)\\s+(not\\s+)?found\\s+in\\s+the\\s+chart,?\\s*(?:it means\\s*)?([^.;]+?)[.;]`,
  'gi'
);
const UD_FOUND_RE = new RegExp(
  `if\\s+${SUBJ}\\s+(?:an?\\s+)?(upward|downward)\\s+star\\s+(?:and(?:\\s+it'?s)?(?:\\s+also)?|but)\\s+(not\\s+)?found\\s+in\\s+the\\s+chart,?\\s*(?:it means\\s*)?([^.;]+?)[.;]`,
  'gi'
);

const ELEM_OPEN_RE = new RegExp(
  `if\\s+the\\s+(fire|air|water|sand)\\s+(?:element|line)\\s+is\\s+(open(?:ed)?|closed)(?:\\s*\\([^)]*\\))?,?\\s*([^.;]+?)[.;]`,
  'gi'
);

// Spelling variants actually seen in the manuscript transcription, mapped to
// content/stars.ts ids. Longest-first so "Kallah Allahu" isn't cut short by
// a shorter alias sharing a prefix.
const STAR_ALIASES: Record<string, string[]> = {
  yussif: ['Yussif', 'Yusuf'],
  adam: ['Adam'],
  mahadi: ['Mahadi'],
  iddris: ['Iddris'],
  ibrahim: ['Ibrahim'],
  issah: ['Issah'],
  umar: ['Umar'],
  ayuba: ['Ayuba'],
  'kalla-allahu': ['Kalla Allahu', 'Kallah Allahu'],
  sulemana: ['Sulemana'],
  ali: ['Ali'],
  nuhu: ['Nuhu'],
  'hassan-hussein': ['Hassan & Hussein', 'Hassan and Hussein'],
  yunus: ['Yunus'],
  usman: ['Usman'],
  musah: ['Musah'],
};
const ALL_NAMES: [string, string][] = Object.entries(STAR_ALIASES)
  .flatMap(([id, aliases]) => aliases.map((a): [string, string] => [a, id]))
  .sort((a, b) => b[0].length - a[0].length);

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const NAME_ALT = ALL_NAMES.map(([name]) => escapeRe(name)).join('|');
const NAMED_STAR_RE = new RegExp(
  `if\\s+you\\s+(?:also\\s+)?(?:found|get)\\s+(${NAME_ALT})\\b(?:\\s*,?\\s*(?:in\\s+)?(?:there\\s+in\\s+)?h(\\d+))?[,]?\\s*(?:there,?\\s*)?(?:it means\\s*)?([^.;]+?)[.;]`,
  'gi'
);

function nameToStarId(name: string): string | null {
  const found = ALL_NAMES.find(([alias]) => alias.toLowerCase() === name.toLowerCase());
  return found ? found[1] : null;
}

function norm(s: string): string {
  const t = s.trim();
  return t.endsWith('.') || t.endsWith(';') ? t : t + '.';
}

function splitInstructionOutcome(text: string): { instruction: string; outcome: string } {
  const body = text.replace(/^\s*Method\s*\d*\s*:\s*/i, '');
  const m = body.match(/(?:^|[.;:]\s*)(?:But |So |Also |Then |And )?[Ii]f\s/);
  if (!m || m.index === undefined) return { instruction: body, outcome: '' };
  const ifPos = body.toLowerCase().indexOf('if', m.index);
  return { instruction: body.slice(0, ifPos), outcome: body.slice(ifPos) };
}

function extractHouseNumbers(s: string): number[] {
  const seen: number[] = [];
  Array.from(s.matchAll(/\bh(\d{1,2})\b/gi)).forEach((m) => {
    const n = Number(m[1]);
    if (n >= 1 && n <= 16 && !seen.includes(n)) seen.push(n);
  });
  return seen;
}

function hasAddPhrase(s: string): boolean {
  return /\badd\b/i.test(s);
}

function hasElementMention(s: string): boolean {
  return /\belement/i.test(s);
}

function dedupOk(labels: string[], minLen = 2): boolean {
  return new Set(labels).size === labels.length && labels.length >= minLen;
}

function expandMulti(re: RegExp, outcome: string, keywords: string[]): [string, string][] {
  const out: [string, string][] = [];
  Array.from(outcome.matchAll(re)).forEach((m) => {
    const blob = m[1];
    const result = m[2].trim();
    const consumed: [number, number][] = [];
    keywords.forEach((k) => {
      const kre = new RegExp(`\\b${escapeRe(k)}\\b`, 'gi');
      Array.from(blob.matchAll(kre)).forEach((km) => {
        const span: [number, number] = [km.index ?? 0, (km.index ?? 0) + km[0].length];
        if (consumed.some((c) => !(span[1] <= c[0] || span[0] >= c[1]))) return;
        consumed.push(span);
        out.push([k.toLowerCase(), result]);
      });
    });
  });
  return out;
}

function tryAxis(outcomeRaw: string): { axis: Axis; outcomes: ParsedOutcome[] } | null {
  const o = norm(outcomeRaw);

  const fu = Array.from(o.matchAll(FU_RE));
  if (fu.length >= 2) {
    const labels = fu.map((m) => `${m[1].toLowerCase()}|${m[2].toLowerCase()}`);
    if (dedupOk(labels)) {
      return {
        axis: { kind: 'fortuneUpdown' },
        outcomes: fu.map((m) => ({ match: `${m[1].toLowerCase()}|${m[2].toLowerCase()}`, text: m[3].trim() })),
      };
    }
  }

  const ftFound = Array.from(o.matchAll(FT_FOUND_RE));
  if (ftFound.length >= 2) {
    const labels = ftFound.map((m) => `${m[1].toLowerCase()}|${m[2] ? 'not found' : 'found'}`);
    if (dedupOk(labels)) {
      return {
        axis: { kind: 'fortuneFoundInChart' },
        outcomes: ftFound.map((m) => ({ match: `${m[1].toLowerCase()}|${m[2] ? 'not found' : 'found'}`, text: m[3].trim() })),
      };
    }
  }

  const udFound = Array.from(o.matchAll(UD_FOUND_RE));
  if (udFound.length >= 2) {
    const labels = udFound.map((m) => `${m[1].toLowerCase()}|${m[2] ? 'not found' : 'found'}`);
    if (dedupOk(labels)) {
      return {
        axis: { kind: 'updownFoundInChart' },
        outcomes: udFound.map((m) => ({ match: `${m[1].toLowerCase()}|${m[2] ? 'not found' : 'found'}`, text: m[3].trim() })),
      };
    }
  }

  const ud = expandMulti(UD_RE, o, UPDOWN_KW);
  if (dedupOk(ud.map((x) => x[0]))) {
    return { axis: { kind: 'updown' }, outcomes: ud.map(([k, t]) => ({ match: k, text: t })) };
  }

  const ft = expandMulti(FT_RE, o, FORTUNE_KW);
  if (dedupOk(ft.map((x) => x[0]))) {
    return { axis: { kind: 'fortune' }, outcomes: ft.map(([k, t]) => ({ match: k, text: t })) };
  }

  const el = expandMulti(EL_RE, o, ELEMENT_KW);
  if (dedupOk(el.map((x) => x[0]))) {
    return { axis: { kind: 'element' }, outcomes: el.map(([k, t]) => ({ match: k, text: t })) };
  }

  const fp = o.match(FOUND_POS_RE);
  const fn = o.match(FOUND_NEG_RE) ?? o.match(FOUND_NEG_RE2);
  if (fp && fn) {
    return {
      axis: { kind: 'foundInChart' },
      outcomes: [
        { match: 'found', text: fp[1].trim() },
        { match: 'not found', text: fn[1].trim() },
      ],
    };
  }

  const eo = Array.from(o.matchAll(ELEM_OPEN_RE));
  if (eo.length >= 1) {
    const elems = Array.from(new Set(eo.map((m) => m[1].toLowerCase())));
    const stateLabels = eo.map((m) => (m[2].toLowerCase().startsWith('open') ? 'opened' : 'closed'));
    if (elems.length === 1 && dedupOk(stateLabels, 1)) {
      const element = elems[0] as 'fire' | 'air' | 'water' | 'sand';
      return {
        axis: { kind: 'elementOpenedClosed', element },
        outcomes: eo.map((m, i) => ({ match: stateLabels[i], text: m[3].trim() })),
      };
    }
  }

  return null;
}

function tryNamedStar(outcomeRaw: string, instrHouses: number[]): { outcomes: ParsedOutcome[]; namedStarHouse: Record<string, number> } | null {
  const o = norm(outcomeRaw);
  const matches = Array.from(o.matchAll(NAMED_STAR_RE));
  if (matches.length === 0) return null;

  const outcomes: ParsedOutcome[] = [];
  const namedStarHouse: Record<string, number> = {};
  matches.forEach((m) => {
    const starId = nameToStarId(m[1]);
    if (!starId) return;
    const house = m[2] ? Number(m[2]) : instrHouses.length === 1 ? instrHouses[0] : null;
    if (house === null) return;
    // one outcome per (star, house) pair — matches on a synthetic key so
    // multiple named-star checks in one method don't collide
    const key = `${starId}@${house}`;
    outcomes.push({ match: key, text: m[3].trim() });
    namedStarHouse[key] = house;
  });
  return outcomes.length > 0 ? { outcomes, namedStarHouse } : null;
}

function parseMethodParagraph(chapterId: string, label: string, text: string): ParsedMethod | null {
  if (/figures omitted/i.test(text)) return null;

  const { instruction, outcome } = splitInstructionOutcome(text);
  if (hasElementMention(instruction)) return null;

  const instrHouses = extractHouseNumbers(instruction);

  // Named-star checks are often folded entirely into the conditional clause
  // ("If you found Kallah Allahu there, ...") with the house given earlier
  // via a separate "Check hN." instruction, or right there in the clause.
  const named = tryNamedStar(outcome, instrHouses);
  if (named) {
    return {
      chapterId,
      label,
      sourceText: text,
      houses: instrHouses,
      axis: { kind: 'namedStar' },
      outcomes: named.outcomes,
      namedStarHouse: named.namedStarHouse,
    };
  }

  if (instrHouses.length === 0) return null;

  const addPhrase = hasAddPhrase(instruction);
  const structureOk = (instrHouses.length === 1 && !addPhrase) || (instrHouses.length >= 2 && addPhrase);
  if (!structureOk) return null;

  const parsed = tryAxis(outcome);
  if (!parsed) return null;

  return {
    chapterId,
    label,
    sourceText: text,
    houses: instrHouses,
    axis: parsed.axis,
    outcomes: parsed.outcomes,
  };
}

/** Parsed per paragraph, index-aligned with the chapter's own paragraphs
 * array — null for a paragraph that isn't a "Method N:" line at all, or
 * one that is but didn't parse safely. Keeping the alignment lets the UI mix
 * computed verdict cards with the plain raw-text display paragraph by
 * paragraph, instead of an all-or-nothing choice per chapter. */
function parseChapterAligned(ch: KmChapter): (ParsedMethod | null)[] {
  return ch.paragraphs.map((p, i) => {
    const labelMatch = p.match(/^\s*Method\s*(\d*)\s*:/i);
    if (!labelMatch) return null;
    const label = labelMatch[1] ? `Method ${labelMatch[1]}` : `Method ${i + 1}`;
    return parseMethodParagraph(ch.id, label, p);
  });
}

let cache: Record<string, (ParsedMethod | null)[]> | null = null;

/** This chapter's methods, index-aligned with its paragraphs array, computed
 * once from the manuscript text. An all-null result (or a chapter absent
 * here) means nothing in it could be safely auto-parsed, and the whole
 * chapter falls back to the plain house-chip display, exactly as before this
 * parser existed. */
export function getParsedMethods(chapterId: string): (ParsedMethod | null)[] {
  if (!cache) {
    cache = {};
    for (const ch of KM_CHAPTERS) {
      cache[ch.id] = parseChapterAligned(ch);
    }
  }
  return cache[chapterId] ?? [];
}
