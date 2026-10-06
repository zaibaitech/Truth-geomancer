// Automatic verdict computation for Kanzul Mikban methods, in two tiers:
//
// 1. A hand-authored entry for the flagship "If She's Going to Stay in the
//    Marriage or Not" chapter (stayMethod1/stayMethod2 below), written and
//    checked against the book's exact wording before the general parser
//    existed. Kept as-is rather than routed through the parser, so its
//    already-verified phrasing never drifts.
// 2. A general parser (methodParser.ts) that reads every other chapter's
//    "Method N: ..." paragraphs and, where the instruction and outcome text
//    match a small set of recognized shapes with real confidence, computes
//    the same kind of result automatically. Anything it can't parse safely
//    — embedded hand-drawn figures, whole-chart tallies, element-isolation
//    techniques, incomplete source text — is left as null, and ReadingTab
//    falls back to the plain house-chip display for exactly those
//    paragraphs (mixed within a chapter where only some methods parse).
//
// The good/bad, upward/downward and (for element-isolation-adjacent checks)
// opened/closed calls all ultimately come from content/classicalAttributes.ts
// (an outside classical-tradition mapping, not sourced from this manuscript)
// or from the manuscript's own element/opened-closed definitions where noted
// — every result surfaces which, so the UI can label it honestly.

import type { Chart } from '@/lib/raml/casting';
import {
  combineHouses,
  combineHouseGroups,
  evaluateHouses,
  getHouseFigure,
  isFoundInChart,
  type CombinedFigure,
} from '@/lib/raml/classicalVerdict';
import type { Fortune, UpDown } from '@/content/classicalAttributes';
import { getParsedMethods, type Axis, type ParsedMethod } from './methodParser';
import { getStarById } from '@/content/stars';
import type { InterpretationBasis } from '@/lib/raml/interpretationBasis';
import { KANZUL_QUALITY_LABEL, KANZUL_QUALITY_UNRESOLVED_NOTE, kanzulQualityOf, type KanzulQuality } from '@/content/kanzulFigureQuality';

export interface MethodVerdictResult {
  label: string;
  methodText: string;
  housesUsed: number[];
  calculationSteps: string[];
  result: CombinedFigure;
  interpretation: string;
  ambiguous: boolean;
  /** Which figure attribute this method's own rule reads (label only — it
   * never changes the outcome). Derived from the parsed rule's Axis. */
  interpretationBasis: InterpretationBasis;
  /** For a star-quality method: the figure's quality from the Kanzul contextual
   * layer (content/kanzulFigureQuality.ts), or 'unresolved'. Null for every
   * method that does not ask for figure quality. */
  figureQuality: KanzulQuality | 'unresolved' | null;
}

/**
 * The basis follows from the method's existing Axis — what its parsed rule
 * already tests — not from the resulting figure and not from any global rule.
 * Exhaustive over Axis['kind'], so a new axis kind can't be left unlabelled.
 */
const BASIS_BY_AXIS: Record<Axis['kind'], InterpretationBasis> = {
  fortune: 'star_quality',
  fortuneUpdown: 'star_quality',
  element: 'element',
  elementOpenedClosed: 'element',
  updown: 'source_specific',
  foundInChart: 'source_specific',
  fortuneFoundInChart: 'source_specific',
  updownFoundInChart: 'source_specific',
  namedStar: 'source_specific',
};

export function basisForAxis(axis: Axis): InterpretationBasis {
  return BASIS_BY_AXIS[axis.kind];
}

/** The figure's contextual quality for a method that reads it; null otherwise. */
function figureQualityFor(axis: Axis, combined: CombinedFigure): KanzulQuality | 'unresolved' | null {
  // 'fortuneFoundInChart' keeps its source_specific basis (found-in-chart is its
  // own rule) but its outcome also reads figure quality, so it carries the context.
  const readsQuality = basisForAxis(axis) === 'star_quality' || axis.kind === 'fortuneFoundInChart';
  return readsQuality ? kanzulQualityOf(combined.starId) ?? 'unresolved' : null;
}

export type MethodVerdictFn = (chart: Chart) => MethodVerdictResult[];

function houseLabel(chart: Chart, n: number): string {
  return `H${n} (${chart.houses[n - 1].star.name})`;
}

function stayMethod1(chart: Chart): MethodVerdictResult {
  const houses = [9, 8];
  const result = combineHouses(chart, houses);
  const ambiguous = result.upDown === 'level';
  const interpretation = ambiguous
    ? "This figure's top and bottom lines match, so the book's upward/downward test doesn't resolve cleanly here — read Method 1's own wording above alongside the resulting figure to judge for yourself."
    : result.upDown === 'upward'
      ? 'She will not stay forever.'
      : "She will stay, Insha'Allah.";

  return {
    label: 'Method 1',
    methodText: "Pick H9 and H8 and add them. Upward → she will not stay forever. Downward → she will stay, Insha'Allah.",
    housesUsed: houses,
    calculationSteps: [`${houseLabel(chart, 9)} + ${houseLabel(chart, 8)} = ${result.starName}`],
    result,
    interpretation,
    ambiguous,
    // Method 1 reads only the up/down direction of the resulting figure.
    interpretationBasis: 'source_specific',
    figureQuality: null,
  };
}

function stayMethod2(chart: Chart): MethodVerdictResult {
  const { group1, group2, final } = combineHouseGroups(chart, [[2, 7], [4, 10]]);
  const quality = kanzulQualityOf(final.starId);
  const ambiguous = final.upDown === 'level' || (quality !== 'good' && quality !== 'bad');

  let interpretation: string;
  if (quality === null) {
    interpretation = `${KANZUL_QUALITY_UNRESOLVED_NOTE} Read Method 2's own wording above alongside the resulting figure to judge for yourself.`;
  } else if (final.upDown === 'level' || quality === 'middle-good') {
    interpretation =
      "This combined figure doesn't land cleanly on one side of the good/bad or upward/downward split the book uses here — read Method 2's own wording above alongside the resulting figure to judge for yourself.";
  } else if (quality === 'good' && final.upDown === 'downward') {
    interpretation = 'She will stay and enjoy the stay.';
  } else if (quality === 'good' && final.upDown === 'upward') {
    interpretation = 'She will leave even though she enjoys the stay.';
  } else if (quality === 'bad' && final.upDown === 'downward') {
    interpretation = 'She will not enjoy the stay, but she will also not leave.';
  } else {
    interpretation =
      'She will leave immediately, sooner than expected, because she will not enjoy staying.';
  }

  return {
    label: 'Method 2',
    methodText:
      "Pick (H2 and H7) then (H4 and H10), add them all. Good+Downward → stays and enjoys it. Good+Upward → leaves despite enjoying it. Bad+Downward → stays but doesn't enjoy it. Bad+Upward → leaves immediately.",
    housesUsed: [2, 7, 4, 10],
    calculationSteps: [
      `${houseLabel(chart, 2)} + ${houseLabel(chart, 7)} = ${group1.starName}`,
      `${houseLabel(chart, 4)} + ${houseLabel(chart, 10)} = ${group2.starName}`,
      `${group1.starName} + ${group2.starName} = ${final.starName}`,
    ],
    result: final,
    interpretation,
    ambiguous,
    // Method 2 reads the figure's good/middle-good/bad quality plus direction.
    interpretationBasis: 'star_quality',
    figureQuality: quality ?? 'unresolved',
  };
}

const HAND_AUTHORED: Record<string, MethodVerdictFn> = {
  'if-she-s-going-to-stay-in-the': (chart) => [stayMethod1(chart), stayMethod2(chart)],
};

const ELEMENT_INDEX: Record<'fire' | 'air' | 'water' | 'sand', number> = {
  fire: 0,
  air: 1,
  water: 2,
  sand: 3,
};

/** Null means "no key": the method's wording can't be resolved for this figure
 * (its Kanzul contextual quality is unresolved), so it stays uncertain. */
function qualityKey(combined: CombinedFigure, second: string): string | null {
  const quality = kanzulQualityOf(combined.starId);
  return quality ? `${quality}|${second}` : null;
}

function computeKey(chart: Chart, axis: Axis, combined: CombinedFigure): string | null {
  switch (axis.kind) {
    case 'updown':
      return combined.upDown;
    case 'fortune':
      return kanzulQualityOf(combined.starId);
    case 'fortuneUpdown':
      return qualityKey(combined, combined.upDown);
    case 'element':
      return combined.element;
    case 'foundInChart':
      return isFoundInChart(chart, combined.pattern) ? 'found' : 'not found';
    case 'fortuneFoundInChart':
      return qualityKey(combined, isFoundInChart(chart, combined.pattern) ? 'found' : 'not found');
    case 'updownFoundInChart':
      return `${combined.upDown}|${isFoundInChart(chart, combined.pattern) ? 'found' : 'not found'}`;
    case 'elementOpenedClosed':
      return combined.pattern[ELEMENT_INDEX[axis.element]] === 1 ? 'opened' : 'closed';
    case 'namedStar':
      return ''; // handled separately, evaluateNamedStar never calls this
  }
}

function factsSummary(chart: Chart, axis: Axis, combined: CombinedFigure): string {
  const bits = [`${combined.starName} (classically ${combined.classicalName})`];
  if (axis.kind === 'fortune' || axis.kind === 'fortuneUpdown' || axis.kind === 'fortuneFoundInChart') {
    const quality = kanzulQualityOf(combined.starId);
    bits.push(quality ? `figure quality: ${KANZUL_QUALITY_LABEL[quality]}` : 'figure quality: not classified');
  }
  if (axis.kind === 'updown' || axis.kind === 'fortuneUpdown' || axis.kind === 'updownFoundInChart') {
    bits.push(combined.upDown);
  }
  if (axis.kind === 'foundInChart' || axis.kind === 'fortuneFoundInChart' || axis.kind === 'updownFoundInChart') {
    bits.push(isFoundInChart(chart, combined.pattern) ? 'found in the chart' : 'not found in the chart');
  }
  if (axis.kind === 'elementOpenedClosed') {
    bits.push(combined.pattern[ELEMENT_INDEX[axis.element]] === 1 ? 'opened' : 'closed');
  }
  return bits.join(', ');
}

function buildCalcSteps(chart: Chart, houses: number[], combined: CombinedFigure): string[] {
  if (houses.length === 1) return [`H${houses[0]} = ${combined.starName}`];
  return [`${houses.map((h) => houseLabel(chart, h)).join(' + ')} = ${combined.starName}`];
}

function evaluateNamedStar(chart: Chart, pm: ParsedMethod): MethodVerdictResult {
  const checks = pm.outcomes.map((o) => {
    const house = pm.namedStarHouse?.[o.match] ?? pm.houses[0];
    const starId = o.match.split('@')[0];
    const actual = chart.houses[house - 1].star;
    return { house, starId, actual, outcome: o };
  });
  const matched = checks.find((c) => c.actual.id === c.starId);
  const allHouses = Array.from(new Set(checks.map((c) => c.house)));
  const calcSteps = checks.map((c) => `H${c.house} = ${c.actual.name}`);
  const primary = checks[0];
  const resultFigure = getHouseFigure(chart, primary.house);

  if (matched) {
    return {
      label: pm.label,
      methodText: pm.sourceText,
      housesUsed: allHouses,
      calculationSteps: calcSteps,
      result: resultFigure,
      interpretation: matched.outcome.text,
      ambiguous: false,
      interpretationBasis: 'source_specific',
      figureQuality: null,
    };
  }

  const expectedName = (starId: string) => getStarById(starId)?.name ?? starId;
  const interpretation =
    checks.length === 1
      ? `The method looks for ${expectedName(primary.starId)} at H${primary.house} specifically; this chart has ${primary.actual.name} there instead, so this particular indicator doesn't apply to this reading.`
      : `This method looks for a specific star at each house listed above; none of those exact matches turned up in this chart (${calcSteps.join(', ')}), so this particular indicator doesn't apply to this reading.`;

  return {
    label: pm.label,
    methodText: pm.sourceText,
    housesUsed: allHouses,
    calculationSteps: calcSteps,
    result: resultFigure,
    interpretation,
    ambiguous: true,
    interpretationBasis: 'source_specific',
    figureQuality: null,
  };
}

function evaluateParsedMethod(chart: Chart, pm: ParsedMethod): MethodVerdictResult {
  if (pm.axis.kind === 'namedStar') return evaluateNamedStar(chart, pm);

  const combined = evaluateHouses(chart, pm.houses);
  const key = computeKey(chart, pm.axis, combined);
  const outcome = key === null ? undefined : pm.outcomes.find((o) => o.match === key);
  const basis = basisForAxis(pm.axis);
  const figureQuality = figureQualityFor(pm.axis, combined);
  const calculationSteps = buildCalcSteps(chart, pm.houses, combined);

  if (outcome) {
    return {
      label: pm.label,
      methodText: pm.sourceText,
      housesUsed: pm.houses,
      calculationSteps,
      result: combined,
      interpretation: outcome.text,
      ambiguous: false,
      interpretationBasis: basis,
      figureQuality,
    };
  }

  return {
    label: pm.label,
    methodText: pm.sourceText,
    housesUsed: pm.houses,
    calculationSteps,
    result: combined,
    interpretation:
      key === null
        ? `${KANZUL_QUALITY_UNRESOLVED_NOTE} Here's what your chart produced so you can judge for yourself: ${factsSummary(chart, pm.axis, combined)}.`
        : `The method's wording above doesn't spell out an outcome for this exact result — here's what your chart actually produced so you can judge for yourself: ${factsSummary(chart, pm.axis, combined)}.`,
    ambiguous: true,
    interpretationBasis: basis,
    figureQuality,
  };
}

/** Index-aligned with the chapter's own paragraphs array — null entries mean
 * "fall back to the plain house-chip display for this paragraph". Returns
 * null only when the chapter isn't in either tier at all. */
export function getMethodVerdicts(chapterId: string, chart: Chart): (MethodVerdictResult | null)[] | null {
  const handAuthored = HAND_AUTHORED[chapterId];
  if (handAuthored) return handAuthored(chart);

  const parsed = getParsedMethods(chapterId);
  if (parsed.length === 0 || parsed.every((pm) => pm === null)) return null;
  return parsed.map((pm) => (pm ? evaluateParsedMethod(chart, pm) : null));
}

export type { Fortune, UpDown };
