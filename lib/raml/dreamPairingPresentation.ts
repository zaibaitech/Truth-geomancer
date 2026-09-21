// Chapter 151 Cast presentation (Prompt 63). The engine already pairs four
// Umuhat and matches the final figure; this module only decides how that
// working is shown. It does not change calculate()/evaluate(), does not
// read H5–H16, and does not treat the three derived figures as Nieces,
// Witnesses, or the Judge — even though a standard shield happens to store
// the same arithmetic at those houses.
import { addPatterns, type Chart } from '@/lib/raml/casting';
import { getStarByPattern, type Pattern, type Star } from '@/content/stars';
import { QUESTION_REGISTRY_META } from '@/lib/raml/questionRegistryMeta';
import { resolveEngineQuestionId } from '@/lib/raml/questionAvailability';
import { resolveQuestionCasting } from '@/lib/raml/engine/castingRequirement';

export const DREAMS_QUESTION_ID = 'dreams-and-their-interpretations';

/** Application instruction for the confirmation screen — not a manuscript quote. */
export const DREAM_PAIRING_BRIEF =
  'Draw the four Mothers (Umuhat). They will be paired to determine the dream interpretation.';

export const MANUSCRIPT_DREAM_QUOTE =
  'If you want to know the meaning of a dream, make only the first 4 stars (Umuhat) and pair them.';

export function usesDreamPairingPresentation(intentionId: string | undefined | null): boolean {
  if (!intentionId) return false;
  const resolved = resolveEngineQuestionId(intentionId);
  const meta = QUESTION_REGISTRY_META[resolved] ?? QUESTION_REGISTRY_META[intentionId];
  const casting = resolveQuestionCasting(meta);
  return casting.showPairingWorking && !casting.showFullShieldTabs;
}


export interface DreamWorkingFigure {
  key: string;
  label: string;
  pattern: Pattern;
  star: Star;
  from?: string;
}

export interface DreamWorking {
  mothers: [DreamWorkingFigure, DreamWorkingFigure, DreamWorkingFigure, DreamWorkingFigure];
  pair1: DreamWorkingFigure;
  pair2: DreamWorkingFigure;
  final: DreamWorkingFigure;
}

function figure(key: string, label: string, pattern: Pattern, from?: string): DreamWorkingFigure {
  return { key, label, pattern, star: getStarByPattern(pattern), from };
}

/** Four Mothers from H1–H4, then Pair 1 = M1+M2, Pair 2 = M3+M4, Final = those two.
 * Derives the three pairing products from the Mothers themselves — never by
 * looking up shield houses H9/H10/H13. */
export function dreamWorkingFromChart(chart: Chart): DreamWorking | null {
  if (chart.houses.length < 4) return null;
  const m1 = chart.houses[0];
  const m2 = chart.houses[1];
  const m3 = chart.houses[2];
  const m4 = chart.houses[3];
  const pair1 = addPatterns(m1.pattern, m2.pattern);
  const pair2 = addPatterns(m3.pattern, m4.pattern);
  const final = addPatterns(pair1, pair2);
  return {
    mothers: [
      figure('mother-1', 'Mother 1', m1.pattern),
      figure('mother-2', 'Mother 2', m2.pattern),
      figure('mother-3', 'Mother 3', m3.pattern),
      figure('mother-4', 'Mother 4', m4.pattern),
    ],
    pair1: figure('pair-1', 'Pair 1', pair1, 'Mother 1 + Mother 2'),
    pair2: figure('pair-2', 'Pair 2', pair2, 'Mother 3 + Mother 4'),
    final: figure('final', 'Final Figure', final, 'Pair 1 + Pair 2'),
  };
}
