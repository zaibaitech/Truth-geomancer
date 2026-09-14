// Abjad (Hisab al-Jummal) validation for the sixteen Hawatim invocations
// transcribed in starUses.ts. Per the restoration brief's section 15, this
// is a DIAGNOSTIC layer only: it calculates each Divine Name's classical
// Abjad-kabir letter value and compares it against the manuscript's own
// stated repeat count, then reports MATCH or DISCREPANCY. It never edits,
// overrides, or "corrects" the manuscript value — a discrepancy here is
// recorded as a discrepancy, not silently resolved either way.
//
// The calling participle "يا" ("O ___") is stripped before summing, since
// it is not part of the Divine Name itself and is not what the manuscript's
// stated count is describing (confirmed by the eleven entries below whose
// stated count exactly equals the bare name's letter sum).

import { STAR_USE_ENTRIES } from './starUses';

const ABJAD_KABIR: Record<string, number> = {
  'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80,
  'ص': 90, 'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600,
  'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000,
};

/** Removes the standalone calling-participle token "يا" (word-for-word, not
 * a substring match) so the sum reflects the Divine Name alone. */
export function stripCallingParticle(phrase: string): string {
  return phrase
    .split(/\s+/)
    .filter((token) => token !== 'يا')
    .join(' ');
}

/** Sums the classical Abjad-kabir value of every recognised Arabic letter in
 * the given text; spaces and unrecognised characters contribute nothing. */
export function abjadValue(phrase: string): number {
  let total = 0;
  for (const ch of phrase) {
    total += ABJAD_KABIR[ch] ?? 0;
  }
  return total;
}

export type AbjadStatus = 'match' | 'partial_match' | 'discrepancy';

/** Stars whose exact manuscript spelling for the Divine Name is flagged, by
 * the restoration brief itself, as needing verification we cannot perform
 * without the original image (Prompt 21, section 5C) — recorded here as an
 * honest flag, not derived from the Abjad arithmetic. */
const SPELLING_UNCERTAIN = new Set(['ali']);

export interface AbjadValidation {
  starId: string;
  /** The manuscript's own invocation phrase, including "يا". */
  invocationArabic: string;
  /** invocationArabic with the calling particle removed. */
  divineNameOnly: string;
  /** The manuscript's own stated repeat count for this invocation. */
  statedValue: number;
  /** The classical Abjad-kabir sum of divineNameOnly. */
  computedValue: number;
  status: AbjadStatus;
  /** Present only for entries this audit specifically documents further —
   * e.g. where the computed value instead matches a DIFFERENT source-verified
   * figure (a Hatim cell), or where only part of a multi-name phrase matches.
   * Never used to assert a "corrected" value. */
  note: string | null;
}

const KNOWN_NOTES: Partial<Record<string, string>> = {
  yussif:
    'Computed Abjad (215) does not match the manuscript\'s stated recitation count (251). 215 also matches the ' +
    'already source-verified Hatim middle-left cell for Yussif (٢١٥) taken at face value, but the wider Hatim-pattern ' +
    'diagnostic (see hatimPattern.ts) finds that value conflicts with the OTHER two verified Hatim cells once the ' +
    'N-4/N-5/N-6 formula is applied — so the relationship between 251, 215, and the Hatim cells is only PARTLY ' +
    'explained, not fully reconciled. All three source-stated numbers (251, 215, and each Hatim cell) are preserved ' +
    'as-is; none is overwritten by another.',
  iddris:
    'Computed Abjad of رحيم (258) does not match the manuscript\'s stated count (115) — but the Prompt 23 ' +
    'manuscript-supplied Hatim cells for Iddris (111/110/109) all agree on N=115 under the N-4/N-5/N-6 formula, ' +
    'exactly matching the stated recitation count. The evidence indicates the Hatim is constructed from the ' +
    'stated count, not from the bare Divine Name\'s Abjad sum (258) — the same relationship found for Ayuba.',
  ayuba:
    'Computed Abjad of باسط (72) does not match the manuscript\'s stated count (312) — but the source-verified Hatim ' +
    'cells for Ayuba are built from exactly 312 (308/307/306 = 312-4/312-5/312-6, all three agreeing). The evidence ' +
    'indicates the Hatim is constructed from the manuscript\'s stated recitation count, not from the bare Divine ' +
    'Name\'s Abjad sum.',
  ali:
    'Computed Abjad of سالم (131) does not match the manuscript\'s stated count (370). Unlike Ayuba and Iddris, the ' +
    'Prompt 23 Hatim cells for Ali (322/325/324) do not even agree with EACH OTHER under the N-4/N-5/N-6 formula ' +
    '(see hatimPattern.ts — status "conflicting"), so there is no Hatim cross-check to fall back on here either. ' +
    'The brief flags Ali\'s Divine Name as needing verification against the exact manuscript spelling; with no ' +
    'source image available, the spelling itself — not just the arithmetic — is reported as unresolved rather ' +
    'than inferred from the transliteration.',
  yunus:
    'The invocation combines two names ("Ya Hayyu Ya Qayyum"). The manuscript\'s stated count (18) equals the Abjad ' +
    'of حي ("Al-Hayy") alone (18), not the combined phrase\'s letter sum (174) nor قيوم alone (156). Reported as a ' +
    'partial match rather than asserted as either a full match or a full discrepancy.',
};

/** For a multi-word phrase whose full sum doesn't match the stated count,
 * checks whether any SINGLE word of it does — this is how Yunus's "يا حي يا
 * قيوم" (18) is found to match حي ("Al-Hayy", 18) alone, without hard-coding
 * that star id: any future multi-name entry would be caught the same way. */
function findPartialMatch(divineNameOnly: string, statedValue: number): string | null {
  const words = divineNameOnly.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  return words.find((w) => abjadValue(w) === statedValue) ?? null;
}

/** Built generically from content/manuscripts/starUses.ts — every star's
 * invocation is put through the same calculation; nothing star-specific is
 * hard-coded except the explanatory notes and the spelling-uncertainty flag
 * above, neither of which ever changes a value. */
export function buildAbjadValidations(
  entries: { starId: string; invocation: { arabic: string; count: number } | null }[],
): AbjadValidation[] {
  return entries
    .filter((e) => e.invocation !== null)
    .map((e) => {
      const divineNameOnly = stripCallingParticle(e.invocation!.arabic);
      const computedValue = abjadValue(divineNameOnly);
      const statedValue = e.invocation!.count;
      const partialMatchWord = computedValue === statedValue ? null : findPartialMatch(divineNameOnly, statedValue);
      const status: AbjadStatus = computedValue === statedValue ? 'match' : partialMatchWord ? 'partial_match' : 'discrepancy';
      return {
        starId: e.starId,
        invocationArabic: e.invocation!.arabic,
        divineNameOnly,
        statedValue,
        computedValue,
        status,
        note: KNOWN_NOTES[e.starId] ?? null,
      } satisfies AbjadValidation;
    });
}

/** The precise, non-euphemistic status wording Prompt 21 (section 10)
 * requires — this never says "verified" or hides a discrepancy behind a
 * generic label. */
export function abjadStatusLabel(v: AbjadValidation): string {
  if (v.status === 'match') return 'MATCH';
  if (v.status === 'partial_match') return 'PARTIAL MATCH';
  if (SPELLING_UNCERTAIN.has(v.starId)) return 'SOURCE SPELLING UNRESOLVED';
  return 'SOURCE VALUE \u2260 ABJAD';
}

/** The sixteen invocations' Abjad validation, computed once against the
 * manuscript's own transcribed text — see content/manuscripts/starUses.ts. */
export const ABJAD_VALIDATIONS: AbjadValidation[] = buildAbjadValidations(STAR_USE_ENTRIES);

export function getAbjadValidationByStarId(starId: string): AbjadValidation | undefined {
  return ABJAD_VALIDATIONS.find((v) => v.starId === starId);
}
