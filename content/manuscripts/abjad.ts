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

export type AbjadStatus = 'match' | 'discrepancy';

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
    'Computed Abjad (215) does not match the manuscript\'s stated recitation count (251), but it does match the ' +
    'already source-verified Hatim middle-left cell for Yussif (٢١٥ = 215) — see content/manuscripts/hatim.ts. Both ' +
    'source-stated numbers (251 recitation count, 215 Hatim cell) are preserved as-is; neither is overwritten by the other.',
  iddris:
    'Computed Abjad of رحيم (258) does not match the manuscript\'s stated count (115). No matching alternate ' +
    'reading was found elsewhere in the source; reported as an open source/math discrepancy, not corrected.',
  ayuba:
    'Computed Abjad of باسط (72) does not match the manuscript\'s stated count (312), but 312 is exactly the value ' +
    'the source-verified Hatim cells for Ayuba are built from (308/307/306 = 312-4/312-5/312-6). The manuscript\'s ' +
    'stated count is preserved; the discrepancy is with the bare name\'s letter sum only.',
  ali:
    'Computed Abjad of سالم (131) does not match the manuscript\'s stated count (370). The brief flags Ali\'s Divine ' +
    'Name as needing verification against the exact manuscript spelling; this is reported as unresolved rather than ' +
    'inferred from the transliteration.',
  yunus:
    'The invocation combines two names ("Ya Hayyu Ya Qayyum"). The manuscript\'s stated count (18) equals the Abjad ' +
    'of حي ("Al-Hayy") alone (18), not the combined phrase\'s letter sum (174) nor قيوم alone (156). Reported as a ' +
    'partial match rather than asserted as either a full match or a full discrepancy.',
};

/** Built generically from content/manuscripts/starUses.ts — every star's
 * invocation is put through the same calculation; nothing star-specific is
 * hard-coded except the explanatory notes above, which never change a value. */
export function buildAbjadValidations(
  entries: { starId: string; invocation: { arabic: string; count: number } | null }[],
): AbjadValidation[] {
  return entries
    .filter((e) => e.invocation !== null)
    .map((e) => {
      const divineNameOnly = stripCallingParticle(e.invocation!.arabic);
      const computedValue = abjadValue(divineNameOnly);
      const statedValue = e.invocation!.count;
      return {
        starId: e.starId,
        invocationArabic: e.invocation!.arabic,
        divineNameOnly,
        statedValue,
        computedValue,
        status: computedValue === statedValue ? 'match' : 'discrepancy',
        note: KNOWN_NOTES[e.starId] ?? null,
      } satisfies AbjadValidation;
    });
}

/** The sixteen invocations' Abjad validation, computed once against the
 * manuscript's own transcribed text — see content/manuscripts/starUses.ts. */
export const ABJAD_VALIDATIONS: AbjadValidation[] = buildAbjadValidations(STAR_USE_ENTRIES);

export function getAbjadValidationByStarId(starId: string): AbjadValidation | undefined {
  return ABJAD_VALIDATIONS.find((v) => v.starId === starId);
}
