// Helpers for automatically combining chart houses and resolving the
// resulting figure's classical (not manuscript-sourced) good/bad and
// upward/downward attributes — see content/classicalAttributes.ts for the
// full sourcing note and its caveats.

import type { Chart } from './casting';
import { addPatterns } from './casting';
import type { Pattern } from '@/content/stars';
import { getStarByPattern } from '@/content/stars';
import { getClassicalAttribute, type Fortune, type UpDown } from '@/content/classicalAttributes';

export interface CombinedFigure {
  houses: number[];
  pattern: Pattern;
  starId: string;
  starName: string;
  classicalName: string;
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
    fortune: attr.fortune,
    upDown: attr.upDown,
  };
}

/** Combine two or more houses by simple sequential geomantic addition
 * (house[0] + house[1], then + house[2], ...). */
export function combineHouses(chart: Chart, houseNumbers: number[]): CombinedFigure {
  if (houseNumbers.length < 2) throw new Error('combineHouses needs at least 2 houses');
  let pattern = chart.houses[houseNumbers[0] - 1].pattern;
  for (let i = 1; i < houseNumbers.length; i++) {
    pattern = addPatterns(pattern, chart.houses[houseNumbers[i] - 1].pattern);
  }
  return describeFigure(houseNumbers, pattern);
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
