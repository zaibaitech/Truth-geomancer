// PROTECTED (paid / restricted) content, the source of truth for leak
// fingerprints (Stage 1a).
//
// Nothing protected is copied into this file. Strings are read at run time
// from the modules that already hold them, then free material
// (publicContentAllowlist.ts) is subtracted by buildFingerprints().
//
// Groups map to the plan's protected categories:
//   kanzul-text        153 Kanzul Mikban chapters / methods + front matter
//   master-text        The Master of Geomancy chapters, Dedication, Introduction
//   master-star-uses   verbatim "stars and their uses" (Master Ch. 4)
//   engine-methods     engine method quotes + verdict interpretations (all paid questions)
//   verdict-logic      server verdict/parser wording (methodVerdicts, methodParser)
//   reader-manuscripts dream / gift-visitor / abjad / reconciliation data (reader only)
//   stars-restricted   per-star house-6 / house-2 meanings, remedies, sadaqah  (L1)
//   stars-occupations  ELEMENT_OCCUPATIONS (author decision pending; part of L1)
//   hatim-values       Hatim diagram border values for all 16 stars          (L2)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ELEMENT_OCCUPATIONS, STARS } from '@/content/stars';
import * as Kanzul from '@/lib/server/content/kanzulMikban';
import * as Master from '@/lib/server/content/masterOfGeomancy';
import { STAR_USE_ENTRIES } from '@/content/manuscripts/starUses';
import * as Dreams from '@/content/manuscripts/dreamInterpretations';
import * as GiftVisitor from '@/content/manuscripts/giftVisitorFigures';
import * as Abjad from '@/content/manuscripts/abjad';
import * as ValueReconciliation from '@/content/manuscripts/valueReconciliation';
import { collectStrings, stringLiteralsInSource, type ProtectedString } from '../guards/lib/leakMatcher';
import { REPO_ROOT } from '../guards/lib/importGraph';

const read = (file: string) => readFileSync(join(REPO_ROOT, file), 'utf8');

/** The engine question file for the one free sample method (see allowlist). */
export const FREE_SAMPLE_QUESTION_FILE = 'lib/raml/engine/questions/ownHouseInLife.ts';

function fromValues(group: string, source: string, value: unknown): ProtectedString[] {
  return collectStrings(value).map((text) => ({ group, source, text }));
}

function fromLiterals(group: string, file: string): ProtectedString[] {
  return stringLiteralsInSource(read(file)).map((text) => ({ group, source: file, text }));
}

function hatimTriplets(): ProtectedString[] {
  // RAW_HATIMS is not exported, so read the explicit source values. The
  // fingerprint is the minified shape webpack emits:
  // starId:"usman",variable:[108,102,105]
  const file = 'content/manuscripts/hatim.ts';
  const out: ProtectedString[] = [];
  const re = /starId:\s*"([^"]+)",\s*variable:\s*\[(\d+),\s*(\d+),\s*(\d+)\]/g;
  let m: RegExpExecArray | null;
  const src = read(file);
  while ((m = re.exec(src))) {
    out.push({ group: 'hatim-values', source: file, text: `starId:"${m[1]}",variable:[${m[2]},${m[3]},${m[4]}]`, exact: true });
  }
  return out;
}

export function protectedStrings(): ProtectedString[] {
  const questionDir = 'lib/raml/engine/questions';
  const questionFiles = readdirSync(join(REPO_ROOT, questionDir))
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts')
    .map((f) => `${questionDir}/${f}`)
    .filter((f) => f !== FREE_SAMPLE_QUESTION_FILE);

  return [
    ...fromValues('kanzul-text', 'lib/server/content/kanzulMikban.ts', {
      chapters: Kanzul.KM_CHAPTERS.map((c) => c.paragraphs),
      front: Kanzul.KM_FRONT_MATTER,
      invocation: Kanzul.KM_OPENING_INVOCATION,
      titlePage: Kanzul.KM_TITLE_PAGE,
      note: Kanzul.KM_EDITION_NOTE,
    }),
    ...fromValues('master-text', 'lib/server/content/masterOfGeomancy.ts', {
      intro: Master.INTRODUCTION,
      dedication: Master.DEDICATION,
      chapters: Master.CHAPTERS,
    }),
    ...fromValues('master-star-uses', 'content/manuscripts/starUses.ts', STAR_USE_ENTRIES),
    ...questionFiles.flatMap((f) => fromLiterals('engine-methods', f)),
    ...fromLiterals('verdict-logic', 'lib/server/raml/methodVerdicts.ts'),
    ...fromLiterals('verdict-logic', 'lib/server/raml/methodParser.ts'),
    ...fromValues('reader-manuscripts', 'content/manuscripts/dreamInterpretations.ts', Dreams),
    ...fromValues('reader-manuscripts', 'content/manuscripts/giftVisitorFigures.ts', GiftVisitor),
    ...fromValues('reader-manuscripts', 'content/manuscripts/abjad.ts', Abjad),
    ...fromValues('reader-manuscripts', 'content/manuscripts/valueReconciliation.ts', ValueReconciliation),
    ...fromValues(
      'stars-restricted',
      'content/stars.ts',
      STARS.map((s) => [s.house6, s.house2, s.sadaqah]),
    ),
    ...fromValues('stars-occupations', 'content/stars.ts', ELEMENT_OCCUPATIONS),
    ...hatimTriplets(),
  ];
}

export const PROTECTED_GROUPS = [
  'kanzul-text',
  'master-text',
  'master-star-uses',
  'engine-methods',
  'verdict-logic',
  'reader-manuscripts',
  'stars-restricted',
  'stars-occupations',
  'hatim-values',
] as const;
export type ProtectedGroup = (typeof PROTECTED_GROUPS)[number];
