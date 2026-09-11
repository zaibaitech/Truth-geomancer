// Helpers for automatically combining chart houses and resolving the
// resulting figure's classical (not manuscript-sourced) good/bad and
// upward/downward attributes — see content/classicalAttributes.ts for the
// full sourcing note and its caveats.

import type { Chart } from './casting';
import { addPatterns } from './casting';
import type { Element, Pattern } from '@/content/stars';
import { getStarByPattern } from '@/content/stars';
import { getClassicalAttribute, type Fortune, type UpDown } from '@/content/classicalAttributes';

export interface CombinedFigure {
  houses: number[];
  pattern: Pattern;
  starId: string;
  starName: string;
  classicalName: string;
  element: Element;
  fortune: Fortune;
  upDown: UpDown;
}

function describeFigure(houses: number[], pattern: Pattern): CombinedFigure {
  const star = getStarByPattern(pattern);
  const attr = getClassicalAttribute(star.id);
  return {
    houses,
    pattern,
    starId: star.id,
    starName: star.name,
    classicalName: attr.classicalName,
    element: star.element,
    fortune: attr.fortune,
    upDown: attr.upDown,
  };
}

/** The figure already sitting at a single house — no addition needed. */
export function getHouseFigure(chart: Chart, houseNumber: number): CombinedFigure {
  return describeFigure([houseNumber], chart.houses[houseNumber - 1].pattern);
}

/** Combine two or more houses by simple sequential geomantic addition
 * (house[0] + house[1], then + house[2], ...). Geomantic addition is
 * associative and commutative (verified computationally), so this gives the
 * same result regardless of how a method's own wording groups or orders the
 * houses it names — only the set of houses combined matters. */
export function combineHouses(chart: Chart, houseNumbers: number[]): CombinedFigure {
  if (houseNumbers.length < 2) throw new Error('combineHouses needs at least 2 houses');
  let pattern = chart.houses[houseNumbers[0] - 1].pattern;
  for (let i = 1; i < houseNumbers.length; i++) {
    pattern = addPatterns(pattern, chart.houses[houseNumbers[i] - 1].pattern);
  }
  return describeFigure(houseNumbers, pattern);
}

/** Combine any number of houses (a single house is just that house's own
 * figure; two or more are added together per combineHouses). */
export function evaluateHouses(chart: Chart, houseNumbers: number[]): CombinedFigure {
  if (houseNumbers.length === 1) return getHouseFigure(chart, houseNumbers[0]);
  return combineHouses(chart, houseNumbers);
}

/** Whether a pattern matches any of the chart's own 16 houses right now —
 * purely mechanical, no external attribution involved. */
export function isFoundInChart(chart: Chart, pattern: Pattern): boolean {
  return chart.houses.some((h) => h.pattern.every((v, i) => v === pattern[i]));
}

/** Combine two groups of houses independently, then add the two resulting
 * figures together — for methods phrased as "pick (hA and hB) then (hC and
 * hD), add them all". */
export function combineHouseGroups(chart: Chart, groups: [number[], number[]]): {
  group1: CombinedFigure;
  group2: CombinedFigure;
  final: CombinedFigure;
} {
  const group1 = combineHouses(chart, groups[0]);
  const group2 = combineHouses(chart, groups[1]);
  const finalPattern = addPatterns(group1.pattern, group2.pattern);
  const final = describeFigure([...groups[0], ...groups[1]], finalPattern);
  return { group1, group2, final };
}
