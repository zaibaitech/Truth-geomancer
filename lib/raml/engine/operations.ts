// Reusable geomantic operations (section 7). Every one of these is built on
// the SAME primitives the rest of the app already uses — addPatterns from
// lib/raml/casting.ts, getStarByPattern from content/stars.ts, the classical
// attribute table — so there is exactly one place the actual geomantic math
// lives. Methods in engine/questions/* are built only from these; they never
// touch addPatterns or getStarByPattern directly.

import { addPatterns } from '../casting';
import type { Element, Pattern } from '@/content/stars';
import { getStarByPattern } from '@/content/stars';
import { getClassicalAttribute } from '@/content/classicalAttributes';
import { qualitiesFor } from './chartModel';
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

// --- CHECK_FIGURE_PRESENT_IN_CHART / COUNT_FIGURE_OCCURRENCES ----------

/** Whether a figure's pattern matches any of the chart's own 16 houses right
 * now — purely mechanical, needs no external attribution. */
export function CHECK_FIGURE_PRESENT_IN_CHART(chart: ChartModel, pattern: Pattern): { found: boolean; trace: OperationTrace } {
  const found = chart.houses.some((h) => h.dotPattern.every((v, i) => v === pattern[i]));
  return {
    found,
    trace: { operation: 'CHECK_FIGURE_PRESENT_IN_CHART', description: found ? 'found elsewhere in the chart' : 'not found elsewhere in the chart' },
  };
}

export function COUNT_FIGURE_OCCURRENCES(chart: ChartModel, pattern: Pattern): { count: number; trace: OperationTrace } {
  const count = chart.houses.filter((h) => h.dotPattern.every((v, i) => v === pattern[i])).length;
  return { count, trace: { operation: 'COUNT_FIGURE_OCCURRENCES', description: `occurs ${count} time(s) in the chart` } };
}

// --- CHECK_ELEMENT / EXTRACT_ELEMENT ------------------------------------

export function CHECK_ELEMENT(figure: ComputedFigure): { element: Element; trace: OperationTrace } {
  return { element: figure.element, trace: { operation: 'CHECK_ELEMENT', description: `${figure.figureName} is a ${figure.element} figure` } };
}

const ELEMENT_INDEX: Record<Element, number> = { fire: 0, air: 1, water: 2, sand: 3 };

/** Build a NEW synthetic figure by reading one element's line off each of N
 * houses in order and stacking those values as a fresh 4-line pattern — the
 * exact mechanic lib/raml/casting.ts already uses to derive Daughters from
 * Mothers (read across a line position across several source figures),
 * generalized to an arbitrary house list and a single chosen element. This
 * is the "pick hA, hB, hC, hD's fire elements and form one star" method
 * shape (e.g. Kanzul Mikban ch.1 Method 3). Requires exactly 4 houses, since
 * a figure always has exactly 4 lines. */
export function EXTRACT_ELEMENT(chart: ChartModel, houseNumbers: number[], element: Element): { figure: ComputedFigure; trace: OperationTrace } {
  if (houseNumbers.length !== 4) {
    throw new Error('EXTRACT_ELEMENT needs exactly 4 houses to form a new 4-line figure');
  }
  const idx = ELEMENT_INDEX[element];
  const houses = houseNumbers.map((n) => houseAt(chart, n));
  const pattern = houses.map((h) => h.dotPattern[idx]) as Pattern;
  const figure = describeFigure(pattern, houseNumbers);
  return {
    figure,
    trace: {
      operation: 'EXTRACT_ELEMENT',
      description: `${element} line of ${houses.map((h) => `H${h.houseNumber}`).join(', ')} → ${figure.figureName}`,
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

/** Cross-method consensus (section 5/9): whether a question's methods agree,
 * mostly agree, give mixed indications, or conflict. Only methods that
 * actually produced a verdict (status 'verified' and a computable outcome)
 * count toward the comparison — 'needs_review'/'uncertain' methods are
 * reported separately, never silently folded into the tally. */
export function COMPARE_RESULTS(results: MethodResult[]): MethodConsensus {
  const verifiable = results.filter((r) => r.verdict && r.verdict.outcome !== 'uncertain');
  const favourableCount = verifiable.filter((r) => r.verdict!.outcome === 'favourable').length;
  const unfavourableCount = verifiable.filter((r) => r.verdict!.outcome === 'unfavourable').length;
  const mixedCount = verifiable.filter((r) => r.verdict!.outcome === 'mixed').length;
  const uncertainCount = results.length - verifiable.length;
  const verifiableCount = verifiable.length;

  if (verifiableCount === 0) {
    return {
      level: 'insufficient_data',
      favourableCount,
      unfavourableCount,
      mixedCount,
      uncertainCount,
      verifiableCount,
      summary: 'None of this question’s methods could be computed with confidence for this chart.',
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

  const summaries: Record<MethodConsensus['level'], string> = {
    agree: `All ${verifiableCount} of ${verifiableCount} computable method(s) agree.`,
    mostly_agree: `${dominant} of ${verifiableCount} computable methods agree.`,
    mixed: `The ${verifiableCount} computable methods give mixed indications.`,
    conflict: `The computable methods conflict (${favourableCount} favourable vs. ${unfavourableCount} unfavourable).`,
    insufficient_data: '',
  };

  return { level, favourableCount, unfavourableCount, mixedCount, uncertainCount, verifiableCount, summary: summaries[level] };
}
