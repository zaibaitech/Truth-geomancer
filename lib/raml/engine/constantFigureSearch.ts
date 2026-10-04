// Shared shape of the four "constant figure" chapters of Kanzul Mikban —
// Nazir (ch.107), Nutik (ch.108), Itisal (ch.118), Ifusal (ch.119): "pick the
// constant figure of X and add it to any star found in house 1; check whether
// the result is found in the chart; if it is, the first/second/third/last 4
// houses say how soon". The constants themselves come from the author-
// confirmed final edition (see kanzulFinalEditionFigures.ts CONSTANT_FIGURES);
// nothing is defined here. Chapters 108, 118 and 119 say "the same explanation
// as in Nazir" for the timing, so they share Nazir's quarter wording.

import { ADD_CONSTANT_FIGURE_TO_HOUSE, FIND_FIGURE_QUARTER, type ChartQuarter } from './operations';
import type { ChartModel, MethodCalculation } from './types';

/** Chapter 107's own timing wording, by which quarter the result is found in. */
export const NAZIR_TIMING: Record<ChartQuarter, { label: string; text: string }> = {
  mothers: { label: 'first 4 houses (Umuhat)', text: 'within some seconds or days' },
  daughters: { label: 'second 4 houses (Banat)', text: 'within some minutes or weeks' },
  nieces: { label: 'third 4 houses (Hafidat)', text: 'within some hours or months' },
  witnesses: { label: 'last 4 houses (Sumurakat)', text: 'not again, or within many hours or years' },
};

export function constantPlusH1(constantStarId: string) {
  return (chart: ChartModel): MethodCalculation => {
    const { figure, trace } = ADD_CONSTANT_FIGURE_TO_HOUSE(chart, constantStarId, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  };
}

/** Which quarter of the chart the result is found in (null = not in the chart). */
export function resultQuarter(chart: ChartModel, calc: MethodCalculation) {
  const { quarter } = FIND_FIGURE_QUARTER(chart, calc.resultFigure.dotPattern);
  return quarter;
}
