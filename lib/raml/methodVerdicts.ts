// Hand-authored, per-chapter automatic verdict logic for Kanzul Mikban
// methods whose houses and branching rules are simple enough to compute
// outright from the chart, rather than asking the reader to work through
// the raw house chips themselves. Only chapters listed in
// METHOD_VERDICTS get this treatment — every other chapter still falls
// back to the plain house-chip display in ReadingTab.
//
// The good/bad and upward/downward calls used here come from
// content/classicalAttributes.ts (an outside classical-tradition mapping,
// not sourced from this manuscript) — every result surfaces that so the
// UI can label it honestly rather than present it as the book's own claim.

import type { Chart } from './casting';
import { combineHouses, combineHouseGroups, type CombinedFigure } from './classicalVerdict';
import type { Fortune, UpDown } from '@/content/classicalAttributes';

export interface MethodVerdictResult {
  label: string;
  methodText: string;
  housesUsed: number[];
  calculationSteps: string[];
  result: CombinedFigure;
  interpretation: string;
  ambiguous: boolean;
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
  };
}

function stayMethod2(chart: Chart): MethodVerdictResult {
  const { group1, group2, final } = combineHouseGroups(chart, [[2, 7], [4, 10]]);
  const ambiguous = final.upDown === 'level' || final.fortune === 'neutral';

  let interpretation: string;
  if (final.upDown === 'level' || final.fortune === 'neutral') {
    interpretation =
      "This combined figure doesn't land cleanly on one side of the good/bad or upward/downward split the book uses here — read Method 2's own wording above alongside the resulting figure to judge for yourself.";
  } else if (final.fortune === 'good' && final.upDown === 'downward') {
    interpretation = 'She will stay and enjoy the stay.';
  } else if (final.fortune === 'good' && final.upDown === 'upward') {
    interpretation = 'She will leave even though she enjoys the stay.';
  } else if (final.fortune === 'bad' && final.upDown === 'downward') {
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
  };
}

export const METHOD_VERDICTS: Record<string, MethodVerdictFn> = {
  'if-she-s-going-to-stay-in-the': (chart) => [stayMethod1(chart), stayMethod2(chart)],
};

export function getMethodVerdicts(chapterId: string, chart: Chart): MethodVerdictResult[] | null {
  const fn = METHOD_VERDICTS[chapterId];
  return fn ? fn(chart) : null;
}

export type { Fortune, UpDown };
