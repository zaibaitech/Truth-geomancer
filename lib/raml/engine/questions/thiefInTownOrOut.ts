// Source: Kanzul Mikban, Chapter 128 — "If the Thief or the Stolen Thing Is
// in Town or Out of Town" (id "if-the-thief-or-the-stolen-thing-is"). One
// method: H1's own figure will always trivially match itself, so "check if
// it repeats in the chart" means found ELSEWHERE among H2-H16 — the same
// self-exclusion shape already used at chapter 101 (foodMarketOrHome.ts).
// Both branches are explicitly stated (found elsewhere -> in town; not
// found elsewhere -> out of town), so this is fully covered, no gap.
// resultKind 'descriptive': a locational fact.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-thief-or-the-stolen-thing-is';

const method1: MethodDefinition = {
  id: 'thief-in-town-or-out-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After drawing the chart, pick h1 and check if it repeats in the chat as the thief. If it is found in the chart, he/she is still in town. If it is not found in the chart, he/she is gone out of town.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const target = calc.resultFigure.dotPattern.join(',');
    let foundElsewhere = false;
    for (let n = 2; n <= 16; n++) {
      if (CHECK_HOUSE(chart, n).figure.dotPattern.join(',') === target) {
        foundElsewhere = true;
        break;
      }
    }
    return foundElsewhere
      ? { outcome: 'descriptive', label: 'Still in town', interpretation: 'The thief (or the stolen thing) is still in town.', descriptiveAnswer: 'in-town' }
      : { outcome: 'descriptive', label: 'Gone out of town', interpretation: 'The thief (or the stolen thing) has gone out of town.', descriptiveAnswer: 'out-of-town' };
  },
};

export const thiefInTownOrOutQuestion: QuestionDefinition = {
  id: 'if-the-thief-or-the-stolen-thing-is',
  title: 'Is the thief (or the stolen thing) still in town?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
