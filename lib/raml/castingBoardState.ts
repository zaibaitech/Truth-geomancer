// The casting board's own state, kept out of the component so it can be
// tested directly (Prompt 17).
//
// This is bookkeeping, not geomancy: it records how many marks each line has
// received and hands the finished grid to `reduceCount` — the engine's
// existing parity rule, untouched — to produce the four Mothers. The count
// itself never leaves this module for the screen; what the board shows is
// derived state (which draw is active, how many lines carry a mark), never
// the number of taps.
import { reduceCount } from './casting';
import type { Pattern } from '@/content/stars';

/** Four draws of four lines; each cell is that line's mark count. */
export type TapGrid = number[][];

export const DRAW_COUNT = 4;
export const LINE_COUNT = 4;

export function emptyTapGrid(): TapGrid {
  return Array.from({ length: DRAW_COUNT }, () => Array.from({ length: LINE_COUNT }, () => 0));
}

/** Adds exactly one mark. Pure, so a burst of rapid taps applied in sequence
 * lands exactly once each — no coalescing, no double counting. */
export function registerTap(grid: TapGrid, draw: number, line: number): TapGrid {
  return grid.map((row, d) => row.map((n, l) => (d === draw && l === line ? n + 1 : n)));
}

export function isLineMarked(grid: TapGrid, draw: number, line: number): boolean {
  return grid[draw][line] > 0;
}

/** How many of a draw's four lines carry at least one mark. This is a
 * completeness indicator, not a tap count: it never grows past four however
 * long the reader taps. */
export function linesMarked(grid: TapGrid, draw: number): number {
  return grid[draw].filter((n) => n > 0).length;
}

export function isDrawComplete(grid: TapGrid, draw: number): boolean {
  return linesMarked(grid, draw) === LINE_COUNT;
}

export function isCastComplete(grid: TapGrid): boolean {
  return grid.every((_, draw) => isDrawComplete(grid, draw));
}

/** The draw the reader is currently working on — the first with an unmarked
 * line, or the last once every line is marked. */
export function activeDrawIndex(grid: TapGrid): number {
  const index = grid.findIndex((row) => row.some((n) => n === 0));
  return index === -1 ? DRAW_COUNT - 1 : index;
}

/** The four Mothers, through the engine's own parity rule. Identical input
 * gives identical output, exactly as the pre-Prompt-17 board did. */
export function mothersFromTaps(grid: TapGrid): [Pattern, Pattern, Pattern, Pattern] {
  return grid.map((draw) => draw.map((n) => reduceCount(n)) as Pattern) as [Pattern, Pattern, Pattern, Pattern];
}
