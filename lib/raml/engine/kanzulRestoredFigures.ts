// Prompt 58 — figures restored from the Kanzul Mikban manuscript scan
// (book pages 22-23: end of chapter 5 and the start of chapter 6).
//
// Method: every dot was located in the supplied image by pixel position, rows
// read top to bottom (the same order as `Pattern` in content/stars.ts), a
// single dot being centred between the two columns and a double dot sitting in
// both. The resulting 4-row pattern is then looked up in STARS — no figure was
// identified by name. Each entry's `pattern` is the pattern read from the page;
// a test checks it still equals the canonical STARS pattern for `starId`.

import type { Pattern } from '@/content/stars';

export interface RestoredFigure {
  /** Position in the source's own left-to-right list. */
  order: number;
  /** Dot pattern as read from the manuscript, top row first. */
  pattern: Pattern;
  /** Canonical content/stars.ts id for that pattern. */
  starId: string;
}

export interface RestoredFigureCondition {
  chapterNumber: number;
  chapterId: string;
  houses: number[];
  meaning: string;
  figures: RestoredFigure[];
}

export const CH5_H6_WIN: RestoredFigureCondition = {
  chapterNumber: 5,
  chapterId: 'if-you-will-win-a-fight-war-or',
  houses: [6],
  meaning: 'you will win it',
  figures: [
    { order: 1, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
    { order: 2, pattern: [2, 2, 2, 1], starId: 'ayuba' },
    { order: 3, pattern: [2, 2, 2, 2], starId: 'musah' },
    { order: 4, pattern: [2, 1, 1, 1], starId: 'mahadi' },
    { order: 5, pattern: [1, 2, 2, 2], starId: 'adam' },
    { order: 6, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
    { order: 7, pattern: [1, 2, 1, 1], starId: 'yunus' },
  ],
};

export const CH5_H1_H8_DIFFICULT: RestoredFigureCondition = {
  chapterNumber: 5,
  chapterId: 'if-you-will-win-a-fight-war-or',
  houses: [1, 8],
  meaning: "it's not good and it will be difficult to succeed",
  figures: [
    { order: 1, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
    { order: 2, pattern: [1, 2, 1, 2], starId: 'issah' },
    { order: 3, pattern: [1, 2, 1, 1], starId: 'yunus' },
    { order: 4, pattern: [2, 2, 2, 1], starId: 'ayuba' },
  ],
};

export const CH6_H4_H10_OPEN_LAND: RestoredFigureCondition = {
  chapterNumber: 6,
  chapterId: 'if-you-want-to-know-where-your-enemy',
  houses: [4, 10],
  meaning: 'you will see or get him/her in an opened land or desert',
  figures: [
    { order: 1, pattern: [2, 2, 2, 2], starId: 'musah' },
    { order: 2, pattern: [1, 2, 2, 2], starId: 'adam' },
    { order: 3, pattern: [2, 2, 1, 2], starId: 'iddris' },
    { order: 4, pattern: [2, 2, 2, 1], starId: 'ayuba' },
  ],
};

export const RESTORED_FIGURE_CONDITIONS: RestoredFigureCondition[] = [CH5_H6_WIN, CH5_H1_H8_DIFFICULT, CH6_H4_H10_OPEN_LAND];

export const starIdsOf = (c: RestoredFigureCondition): string[] => c.figures.map((f) => f.starId);
