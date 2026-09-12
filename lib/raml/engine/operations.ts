// Reusable geomantic operations (section 7). Every one of these is built on
// the SAME primitives the rest of the app already uses — addPatterns from
// lib/raml/casting.ts, getStarByPattern from content/stars.ts, the classical
// attribute table — so there is exactly one place the actual geomantic math
// lives. Methods in engine/questions/* are built only from these; they never
// touch addPatterns or getStarByPattern directly.

import { addPatterns, buildChart } from '../casting';
import type { Element, Pattern } from '@/content/stars';
import { getStarByPattern } from '@/content/stars';
import { getClassicalAttribute } from '@/content/classicalAttributes';
import { buildChartModel, qualitiesFor } from './chartModel';
import type {
  ChartModel,
  ComputedFigure,
  HouseModel,
  LineState,
  MethodConsensus,
  MethodResult,
  OperationTrace,
} from './types';

function houseAt(chart: ChartModel, n: number): HouseModel {
  const h = chart.houses[n - 1];
  if (!h) throw new Error(`Chart has no house ${n}`);
  return h;
}

function describeFigure(pattern: Pattern, sourceHouses: number[]): ComputedFigure {
  const star = getStarByPattern(pattern);
  return {
    figureId: star.id,
    figureName: star.name,
    classicalName: getClassicalAttribute(star.id).classicalName,
    dotPattern: pattern,
    element: star.element,
    qualities: qualitiesFor(star.id, pattern),
    sourceHouses,
  };
}

function houseLabel(h: HouseModel): string {
  return `H${h.houseNumber} (${h.figureName})`;
}

// --- CHECK_HOUSE -------------------------------------------------------

/** Read one house's figure directly — the "check H6" shape. */
export function CHECK_HOUSE(chart: ChartModel, houseNumber: number): { figure: ComputedFigure; trace: OperationTrace } {
  const h = houseAt(chart, houseNumber);
  const figure: ComputedFigure = {
    figureId: h.figureId,
    figureName: h.figureName,
    classicalName: h.classicalName,
    dotPattern: h.dotPattern,
    element: h.element,
    qualities: h.qualities,
    sourceHouses: [houseNumber],
  };
  return { figure, trace: { operation: 'CHECK_HOUSE', description: `H${houseNumber} = ${h.figureName}` } };
}

// --- ADD_FIGURES / ADD_MULTIPLE_HOUSES ----------------------------------

/** Add two or more houses together. Geomantic addition is associative and
 * commutative (same-parity -> double, different -> single reduces to a
 * simple parity-XOR), so the order/grouping implied by a method's own
 * wording never changes the result — only the SET of houses combined does.
 * This is why "pick h1 and h8, then (h9 and h11), and add all of them" and
 * "pick h1, h8, h9 and h11 and add them" are the same operation here. */
export function ADD_MULTIPLE_HOUSES(chart: ChartModel, houseNumbers: number[]): { figure: ComputedFigure; trace: OperationTrace } {
  if (houseNumbers.length < 2) throw new Error('ADD_MULTIPLE_HOUSES needs at least 2 houses');
  const houses = houseNumbers.map((n) => houseAt(chart, n));
  let pattern = houses[0].dotPattern;
  for (let i = 1; i < houses.length; i++) pattern = addPatterns(pattern, houses[i].dotPattern);
  const figure = describeFigure(pattern, houseNumbers);
  return {
    figure,
    trace: { operation: 'ADD_MULTIPLE_HOUSES', description: `${houses.map(houseLabel).join(' + ')} = ${figure.figureName}` },
  };
}

/** Add a previously-computed figure to one more house — the "add the result
 * to H16" shape. */
export function ADD_FIGURE_TO_HOUSE(chart: ChartModel, figure: ComputedFigure, houseNumber: number): { figure: ComputedFigure; trace: OperationTrace } {
  const h = houseAt(chart, houseNumber);
  const pattern = addPatterns(figure.dotPattern, h.dotPattern);
  const result = describeFigure(pattern, [...figure.sourceHouses, houseNumber]);
  return {
    figure: result,
    trace: { operation: 'ADD_FIGURE_TO_HOUSE', description: `${figure.figureName} + ${houseLabel(h)} = ${result.figureName}` },
  };
}

/** Add two or more ALREADY-COMPUTED figures together (as opposed to
 * ADD_MULTIPLE_HOUSES, which reads its inputs straight off the chart's own
 * houses). New for Kanzul Mikban ch.62/67's "pick the water elements of the
 * first 4 houses, second 4 houses, third 4 houses, and last 4 houses, then
 * add all" shape — each quarter's own element is first extracted into its
 * own synthetic figure (EXTRACT_ELEMENT), and only THEN are those 4 results
 * added together; there is no single set of houses to feed
 * ADD_MULTIPLE_HOUSES directly. (Chapter 1 Method 3, Prompt 2, needed the
 * same capability and worked around its absence by importing `addPatterns`
 * directly — this closes that gap for future chapters without touching
 * that already-shipped file.) Same associative/commutative math as
 * ADD_MULTIPLE_HOUSES, so `sourceHouses` is simply the union of every input
 * figure's own sourceHouses, in order given. */
export function ADD_FIGURES(figures: ComputedFigure[]): { figure: ComputedFigure; trace: OperationTrace } {
  if (figures.length < 2) throw new Error('ADD_FIGURES needs at least 2 figures');
  let pattern = figures[0].dotPattern;
  for (let i = 1; i < figures.length; i++) pattern = addPatterns(pattern, figures[i].dotPattern);
  const sourceHouses = figures.flatMap((f) => f.sourceHouses);
  const result = describeFigure(pattern, sourceHouses);
  return {
    figure: result,
    trace: { operation: 'ADD_FIGURES', description: `${figures.map((f) => f.figureName).join(' + ')} = ${result.figureName}` },
  };
}

// --- CHECK_FIGURE_PRESENT_IN_CHART / COUNT_FIGURE_OCCURRENCES ----------

/** Whether a figure's pattern matches any of the chart's own 16 houses right
 * now — purely mechanical, needs no external attribution. An optional house
 * subset restricts the search (e.g. "found among the first 4 houses") —
 * same optional-houseNumbers shape COUNT_ELEMENTS already uses; omitting it
 * searches the whole chart exactly as before (Kanzul Mikban ch.35 needs the
 * subset form: "found in the Mothers' houses" vs. "found in the Judge's
 * group" changes the reading). */
export function CHECK_FIGURE_PRESENT_IN_CHART(
  chart: ChartModel,
  pattern: Pattern,
  houseNumbers?: number[],
): { found: boolean; trace: OperationTrace } {
  const houses = houseNumbers ? houseNumbers.map((n) => houseAt(chart, n)) : chart.houses;
  const found = houses.some((h) => h.dotPattern.every((v, i) => v === pattern[i]));
  return {
    found,
    trace: { operation: 'CHECK_FIGURE_PRESENT_IN_CHART', description: found ? 'found elsewhere in the chart' : 'not found elsewhere in the chart' },
  };
}

export function COUNT_FIGURE_OCCURRENCES(chart: ChartModel, pattern: Pattern): { count: number; trace: OperationTrace } {
  const count = chart.houses.filter((h) => h.dotPattern.every((v, i) => v === pattern[i])).length;
  return { count, trace: { operation: 'COUNT_FIGURE_OCCURRENCES', description: `occurs ${count} time(s) in the chart` } };
}

// --- FIND_FIGURE_QUARTER --------------------------------------------------
// Prompt 6 audit finding: the "found in the first/second/third/last 4
// houses" mechanic — checking which of the chart's own 4-house quarters
// (Mothers/Daughters/Nieces/Witnesses-Judge-Reconciler) a figure's pattern
// falls into — was independently hand-rolled with the identical
// [1-4]/[5-8]/[9-12]/[13-16] grouping in THREE separate question files
// (chapters 31, 35, 55), and the same manuscript wording recurs many more
// times across chapters not yet implemented (e.g. 62, 71, 79, 82, 90-92,
// 100) — a genuinely reused, source-defined calculation, not a speculative
// abstraction. This only finds WHICH quarter, if any; each question keeps
// its own mapping from quarter to outcome/label/interpretation, since that
// meaning differs per chapter.

export type ChartQuarter = 'mothers' | 'daughters' | 'nieces' | 'witnesses';

export const QUARTER_HOUSES: Record<ChartQuarter, [number, number, number, number]> = {
  mothers: [1, 2, 3, 4],
  daughters: [5, 6, 7, 8],
  nieces: [9, 10, 11, 12],
  witnesses: [13, 14, 15, 16],
};

export function FIND_FIGURE_QUARTER(chart: ChartModel, pattern: Pattern): { quarter: ChartQuarter | null; trace: OperationTrace } {
  const quarter =
    (Object.keys(QUARTER_HOUSES) as ChartQuarter[]).find(
      (q) => CHECK_FIGURE_PRESENT_IN_CHART(chart, pattern, QUARTER_HOUSES[q]).found,
    ) ?? null;
  return {
    quarter,
    trace: {
      operation: 'FIND_FIGURE_QUARTER',
      description: quarter
        ? `found among the ${quarter} houses (H${QUARTER_HOUSES[quarter][0]}-${QUARTER_HOUSES[quarter][3]})`
        : "not found in any of the chart's own 16 houses",
    },
  };
}

// --- CHECK_ELEMENT / EXTRACT_ELEMENT ------------------------------------

export function CHECK_ELEMENT(figure: ComputedFigure): { element: Element; trace: OperationTrace } {
  return { element: figure.element, trace: { operation: 'CHECK_ELEMENT', description: `${figure.figureName} is a ${figure.element} figure` } };
}

const ELEMENT_INDEX: Record<Element, number> = { fire: 0, air: 1, water: 2, sand: 3 };

/** Build a NEW synthetic figure by reading one named line off each of 4
 * houses, in order, and stacking those values as a fresh 4-line pattern —
 * the exact mechanic lib/raml/casting.ts already uses to derive Daughters
 * from Mothers (read across a line position across several source
 * figures), generalized to an arbitrary (house, element) pairing per line.
 * This is the general form; EXTRACT_ELEMENT below is the common special
 * case of reading the SAME element from every house. Kanzul Mikban ch.13
 * Method 1 needs the general form directly: "pick h1 fire element, h5 air
 * element, h4 water element, h10 sand element, and form a star" — a
 * different element from each house, not one element repeated. */
export function EXTRACT_LINES(chart: ChartModel, picks: { house: number; element: Element }[]): { figure: ComputedFigure; trace: OperationTrace } {
  if (picks.length !== 4) {
    throw new Error('EXTRACT_LINES needs exactly 4 (house, element) picks to form a new 4-line figure');
  }
  const values = picks.map(({ house, element }) => houseAt(chart, house).dotPattern[ELEMENT_INDEX[element]]);
  const pattern = values as Pattern;
  const houseList = picks.map(({ house }) => houseAt(chart, house));
  const figure = describeFigure(pattern, houseList.map((h) => h.houseNumber));
  return {
    figure,
    trace: {
      operation: 'EXTRACT_LINES',
      description: `${picks.map(({ house, element }) => `${element} of H${house}`).join(', ')} → ${figure.figureName}`,
    },
  };
}

/** Build a NEW synthetic figure by reading one element's line off each of N
 * houses in order and stacking those values as a fresh 4-line pattern —
 * the common case of EXTRACT_LINES where the same element is read from
 * every house. This is the "pick hA, hB, hC, hD's fire elements and form
 * one star" method shape (e.g. Kanzul Mikban ch.1 Method 3). Requires
 * exactly 4 houses, since a figure always has exactly 4 lines. */
export function EXTRACT_ELEMENT(chart: ChartModel, houseNumbers: number[], element: Element): { figure: ComputedFigure; trace: OperationTrace } {
  if (houseNumbers.length !== 4) {
    throw new Error('EXTRACT_ELEMENT needs exactly 4 houses to form a new 4-line figure');
  }
  const { figure } = EXTRACT_LINES(chart, houseNumbers.map((house) => ({ house, element })));
  return {
    figure,
    trace: {
      operation: 'EXTRACT_ELEMENT',
      description: `${element} line of ${houseNumbers.map((n) => `H${n}`).join(', ')} → ${figure.figureName}`,
    },
  };
}

// --- CHECK_QUALITY / CHECK_DIRECTION / CHECK_STABILITY ------------------

export function CHECK_QUALITY(figure: ComputedFigure): ComputedFigure['qualities'] {
  return figure.qualities;
}

export function CHECK_DIRECTION(figure: ComputedFigure): 'upward' | 'downward' | null {
  return figure.qualities.direction.value;
}

/** Always needs_review — see FigureQualities.stability. The operation exists
 * so the engine architecture supports this axis; it never fabricates a
 * value. */
export function CHECK_STABILITY(figure: ComputedFigure): ComputedFigure['qualities']['stability'] {
  return figure.qualities.stability;
}

/** Which of a specific line's two states (opened = single dot, closed =
 * double dot) a figure has — this one IS manuscript-sourced (see the
 * Kanzul Mikban edition note), unlike fortune/direction. */
export function CHECK_LINE_STATE(figure: ComputedFigure, element: Element): LineState {
  return figure.qualities.lineStates[element];
}

// --- COUNT_ELEMENTS ------------------------------------------------------

export function COUNT_ELEMENTS(chart: ChartModel, houseNumbers?: number[]): Record<Element, number> {
  const houses = houseNumbers ? houseNumbers.map((n) => houseAt(chart, n)) : chart.houses;
  const tally: Record<Element, number> = { fire: 0, air: 0, water: 0, sand: 0 };
  houses.forEach((h) => {
    tally[h.element] += 1;
  });
  return tally;
}

// --- COUNT_FORTUNE / COUNT_DIRECTION ------------------------------------
// New for Kanzul Mikban ch.20's sub-chapter ("check if downward stars are
// more than upward") and ch.22 ("count all the good stars... more than the
// bad stars"): tallying a QUALITY (rather than an element) across the whole
// chart or a subset, same optional-houseNumbers shape as COUNT_ELEMENTS.
// Both qualities are always populated (fortune/direction are the
// classical-tradition-sourced axes every figure already carries), so
// nothing here can silently count an unverified value.

export function COUNT_FORTUNE(chart: ChartModel, houseNumbers?: number[]): Record<'good' | 'middleGood' | 'bad', number> {
  const houses = houseNumbers ? houseNumbers.map((n) => houseAt(chart, n)) : chart.houses;
  const tally: Record<'good' | 'middleGood' | 'bad', number> = { good: 0, middleGood: 0, bad: 0 };
  houses.forEach((h) => {
    const value = h.qualities.fortune.value;
    if (value) tally[value] += 1;
  });
  return tally;
}

/** Direction is sometimes genuinely "level" (null) — those houses simply
 * don't count toward either side, exactly as CHECK_DIRECTION already
 * represents that case (never forced into upward or downward). */
export function COUNT_DIRECTION(chart: ChartModel, houseNumbers?: number[]): { upward: number; downward: number } {
  const houses = houseNumbers ? houseNumbers.map((n) => houseAt(chart, n)) : chart.houses;
  const tally = { upward: 0, downward: 0 };
  houses.forEach((h) => {
    const value = h.qualities.direction.value;
    if (value) tally[value] += 1;
  });
  return tally;
}

// --- CHECK_FIGURE_ADJACENT_REPETITION / CHECK_ELEMENT_ADJACENT_REPETITION -
// New for Kanzul Mikban ch.32 ("check if Ali is following each other in the
// chart" / "when water stars are following each other"): whether a named
// figure, or a given element, occupies two or more CONSECUTIVE house
// positions anywhere in the 16 houses — a positional check neither
// CHECK_FIGURE_PRESENT_IN_CHART nor COUNT_FIGURE_OCCURRENCES provides
// (both ignore house adjacency entirely). Generic and reusable for any
// future "X follows X" source wording.

export function CHECK_FIGURE_ADJACENT_REPETITION(chart: ChartModel, pattern: Pattern): { found: boolean; trace: OperationTrace } {
  let found = false;
  for (let i = 0; i < chart.houses.length - 1; i++) {
    const a = chart.houses[i];
    const b = chart.houses[i + 1];
    if (a.dotPattern.every((v, j) => v === pattern[j]) && b.dotPattern.every((v, j) => v === pattern[j])) {
      found = true;
      break;
    }
  }
  return {
    found,
    trace: { operation: 'CHECK_FIGURE_ADJACENT_REPETITION', description: found ? 'found in two adjacent houses' : 'not found in adjacent houses' },
  };
}

export function CHECK_ELEMENT_ADJACENT_REPETITION(chart: ChartModel, element: Element): { found: boolean; trace: OperationTrace } {
  let found = false;
  for (let i = 0; i < chart.houses.length - 1; i++) {
    if (chart.houses[i].element === element && chart.houses[i + 1].element === element) {
      found = true;
      break;
    }
  }
  return {
    found,
    trace: {
      operation: 'CHECK_ELEMENT_ADJACENT_REPETITION',
      description: found ? `two adjacent ${element} houses found` : `no two adjacent ${element} houses`,
    },
  };
}

// --- COUNT_TOTAL_DOTS ----------------------------------------------------
// New for Kanzul Mikban ch.56 ("count all the dots in the chart, and start
// subtracting 3, 3, 3"): the raw total dot count across the chart (or a
// house subset, same optional-houseNumbers shape as COUNT_ELEMENTS/
// COUNT_FORTUNE/COUNT_DIRECTION) — a DotRow is always 1 or 2 dots, so this
// is just summing every line of every included house's pattern. Distinct
// from every existing COUNT_* primitive, which all tally house/figure
// OCCURRENCES, never the raw dot value itself.

export function COUNT_TOTAL_DOTS(chart: ChartModel, houseNumbers?: number[]): { total: number; trace: OperationTrace } {
  const houses = houseNumbers ? houseNumbers.map((n) => houseAt(chart, n)) : chart.houses;
  const total = houses.reduce((sum, h) => sum + h.dotPattern.reduce((s, v) => s + v, 0), 0);
  return {
    total,
    trace: {
      operation: 'COUNT_TOTAL_DOTS',
      description: `${houseNumbers ? houseNumbers.map((n) => `H${n}`).join(', ') : 'all 16 houses'} → ${total} dots total`,
    },
  };
}

// --- COUNT_OPENED_LINES ---------------------------------------------------
// New for Kanzul Mikban ch.78 ("count all the single dots of the stars from
// h1 to h6"): counts LINES specifically in the opened (single-dot) state
// across the chart or a house subset — distinct from COUNT_TOTAL_DOTS
// (which sums the raw dot VALUE, 1 or 2, of every line) and distinct from
// COUNT_ELEMENTS/COUNT_FORTUNE/COUNT_DIRECTION (which tally whole-figure
// qualities, not individual lines). A DotRow of 1 is exactly the
// manuscript's own "opened/single dot" state (see LineState in types.ts).

export function COUNT_OPENED_LINES(chart: ChartModel, houseNumbers?: number[]): { count: number; trace: OperationTrace } {
  const houses = houseNumbers ? houseNumbers.map((n) => houseAt(chart, n)) : chart.houses;
  const count = houses.reduce((sum, h) => sum + h.dotPattern.filter((v) => v === 1).length, 0);
  return {
    count,
    trace: {
      operation: 'COUNT_OPENED_LINES',
      description: `${houseNumbers ? houseNumbers.map((n) => `H${n}`).join(', ') : 'all 16 houses'} → ${count} opened (single-dot) line(s)`,
    },
  };
}

/** Reduce a positive count to the range 1..n by repeated subtraction of n
 * ("cast out by n's") — a remainder of 0 maps to n itself, not 0, matching
 * the manuscript's own worked convention (ch.56: "subtract 3, 3, 3... if
 * your result is 1 or 3... but if it's 2", i.e. never a 0). Pure arithmetic,
 * no chart access — kept here as a small reusable helper rather than
 * inlined per-question, since "cast out by N" is a named, reusable
 * classical technique, not specific to any one chapter's wording. */
export function CAST_OUT_BY(total: number, n: number): number {
  if (n < 1) throw new Error('CAST_OUT_BY needs n >= 1');
  if (total < 1) throw new Error('CAST_OUT_BY needs a positive total');
  const remainder = total % n;
  return remainder === 0 ? n : remainder;
}

// --- RECAST_FROM_HOUSES --------------------------------------------------

/** New for Kanzul Mikban ch.34 Method 1: "pick h3, h7, h11 and h15 and use
 * them to form new Umuhat (mother houses)... use the Umuhat to form another
 * chart." A known classical technique — treat 4 named houses' own figures
 * as a fresh set of 4 Mothers and run the full casting algorithm again to
 * derive an entirely separate 16-house chart. Reuses buildChart/
 * buildChartModel exactly as designed (neither is modified); this is the
 * one new primitive this stage needed that couldn't be composed from the
 * others, since nothing existing produces a SECOND chart from the first
 * one's own houses. */
export function RECAST_FROM_HOUSES(chart: ChartModel, houseNumbers: [number, number, number, number]): { chart: ChartModel; trace: OperationTrace } {
  const houses = houseNumbers.map((n) => houseAt(chart, n));
  const newMothers = houses.map((h) => h.dotPattern) as [Pattern, Pattern, Pattern, Pattern];
  const newChart = buildChartModel(buildChart(newMothers));
  return {
    chart: newChart,
    trace: {
      operation: 'RECAST_FROM_HOUSES',
      description: `${houses.map(houseLabel).join(', ')} used as new Mothers → a fresh 16-house chart`,
    },
  };
}

// --- MATCH_FIGURE / MATCH_QUALITIES -------------------------------------

export function MATCH_FIGURE(figure: ComputedFigure, targetFigureId: string): boolean {
  return figure.figureId === targetFigureId;
}

export interface QualityMatch {
  fortune?: 'good' | 'middleGood' | 'bad';
  direction?: 'upward' | 'downward';
}

export function MATCH_QUALITIES(figure: ComputedFigure, match: QualityMatch): boolean {
  if (match.fortune !== undefined && figure.qualities.fortune.value !== match.fortune) return false;
  if (match.direction !== undefined && figure.qualities.direction.value !== match.direction) return false;
  return true;
}

// --- COMPARE_RESULTS -----------------------------------------------------

/** Descriptive consensus (Prompt 4.5, section 4): categorical answers
 * (terrain type, direction, location) are compared by equality — "Methods
 * agree" / "Methods disagree" — never voted into a favourable/unfavourable/
 * mixed tally that was never the right shape for this kind of question. */
function compareDescriptiveResults(totalCount: number, verifiable: MethodResult[]): MethodConsensus {
  const uncertainCount = totalCount - verifiable.length;
  const verifiableCount = verifiable.length;

  if (verifiableCount === 0) {
    return {
      kind: 'descriptive',
      level: 'insufficient_data',
      favourableCount: 0,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount,
      verifiableCount,
      summary: 'None of this question’s methods could be computed with confidence for this chart.',
      descriptiveAnswer: null,
    };
  }

  const answers = new Set(verifiable.map((r) => r.verdict!.descriptiveAnswer));
  const allAgree = answers.size === 1;

  return {
    kind: 'descriptive',
    level: allAgree ? 'agree' : 'disagree',
    favourableCount: 0,
    unfavourableCount: 0,
    mixedCount: 0,
    uncertainCount,
    verifiableCount,
    summary: allAgree
      ? `All ${verifiableCount} of ${verifiableCount} computable method(s) agree.`
      : `The ${verifiableCount} computable methods give different answers.`,
    // Agreement itself is decided on the normalized `descriptiveAnswer` key
    // (so "water" === "water" even if phrasing ever diverged), but what gets
    // stored here for display is the method's own human-readable `label`
    // ("Northern direction", not the raw key "water") — `descriptiveAnswer`
    // on MethodVerdict is documented as "never displayed raw".
    descriptiveAnswer: allAgree ? (verifiable[0].verdict!.label ?? null) : null,
  };
}

/** Cross-method consensus (section 5/9): whether a question's methods agree,
 * mostly agree, give mixed indications, or conflict. Only methods that
 * actually produced a verdict (status 'verified' and a computable outcome)
 * count toward the comparison — 'needs_review'/'uncertain' methods are
 * reported separately, never silently folded into the tally.
 *
 * `resultKind` (Prompt 4.5) comes from the QUESTION itself, not inferred
 * from which methods happened to compute — a descriptive question whose
 * only method fails to compute is still an "insufficient descriptive
 * result," not silently relabeled as an outcome question just because no
 * verdict survived to say otherwise. Defaults to 'outcome' so every
 * pre-existing call site (and question) needs no change. */
export function COMPARE_RESULTS(results: MethodResult[], resultKind: 'outcome' | 'descriptive' = 'outcome'): MethodConsensus {
  const verifiable = results.filter((r) => r.verdict && r.verdict.outcome !== 'uncertain');

  if (resultKind === 'descriptive') {
    return compareDescriptiveResults(results.length, verifiable);
  }

  const favourableCount = verifiable.filter((r) => r.verdict!.outcome === 'favourable').length;
  const unfavourableCount = verifiable.filter((r) => r.verdict!.outcome === 'unfavourable').length;
  const mixedCount = verifiable.filter((r) => r.verdict!.outcome === 'mixed').length;
  const uncertainCount = results.length - verifiable.length;
  const verifiableCount = verifiable.length;

  if (verifiableCount === 0) {
    return {
      kind: 'outcome',
      level: 'insufficient_data',
      favourableCount,
      unfavourableCount,
      mixedCount,
      uncertainCount,
      verifiableCount,
      summary: 'None of this question’s methods could be computed with confidence for this chart.',
      descriptiveAnswer: null,
    };
  }

  const dominant = Math.max(favourableCount, unfavourableCount, mixedCount);
  const dominantIsUnanimous = dominant === verifiableCount;
  const tally = [favourableCount, unfavourableCount, mixedCount].filter((c) => c > 0);
  const isTiedSplit = tally.length >= 2 && tally.every((c) => c === tally[0]);

  let level: MethodConsensus['level'];
  if (dominantIsUnanimous) {
    level = 'agree';
  } else if (mixedCount > 0 && favourableCount > 0 && unfavourableCount > 0) {
    level = 'conflict';
  } else if (isTiedSplit) {
    level = favourableCount > 0 && unfavourableCount > 0 ? 'conflict' : 'mixed';
  } else if (dominant / verifiableCount > 0.5) {
    level = 'mostly_agree';
  } else {
    level = 'mixed';
  }

  const summaries: Record<Exclude<MethodConsensus['level'], 'disagree'>, string> = {
    agree: `All ${verifiableCount} of ${verifiableCount} computable method(s) agree.`,
    mostly_agree: `${dominant} of ${verifiableCount} computable methods agree.`,
    mixed: `The ${verifiableCount} computable methods give mixed indications.`,
    conflict: `The computable methods conflict (${favourableCount} favourable vs. ${unfavourableCount} unfavourable).`,
    insufficient_data: '',
  };

  return {
    kind: 'outcome',
    level,
    favourableCount,
    unfavourableCount,
    mixedCount,
    uncertainCount,
    verifiableCount,
    summary: summaries[level],
    descriptiveAnswer: null,
  };
}
