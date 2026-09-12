// Source: Kanzul Mikban, Chapter 136 — "If the Traveller Has Reached Where
// He/She Is Going or Not" (id "if-the-traveller-has-reached-where-he-she").
// One method, but four distinct conditions stated in sequence with no
// explicit priority given when more than one is satisfied at once:
//   - H1 downward -> reached home safely.
//   - H1 not downward -> not reached yet (the generic negative).
//   - H1's figure repeats at H3 or H9 -> still on the way.
//   - H1's figure repeats at H7 -> reached town but not home yet.
// The two repeat-position checks are logically independent of the direction
// check (a figure's direction and where else it repeats are unrelated), so
// a chart can genuinely satisfy more than one of these simultaneously (e.g.
// H1 downward AND ALSO repeating at H7) with no stated way to prefer one
// answer over another. Rather than silently picking a winner, any chart
// that trips more than one of these three specific conditions
// (reached-home-safely / on-the-way / reached-town-not-home) is left
// uncertain — matching the chapter 103 Method 2 precedent for stated-but-
// overlapping branches. Exactly one triggered condition resolves cleanly;
// none triggered falls back to the generic "not reached yet" negative.
// resultKind 'descriptive': a travel-progress status, not a
// favourable/unfavourable outcome.

import { CHECK_DIRECTION, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-traveller-has-reached-where-he-she';

const method1: MethodDefinition = {
  id: 'traveller-reached-destination-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check h1. If it's a downward star, he/she has reached home safely. If it's not a downward star, he/she has not reached yet. If house 1 repeats in h3 or h9, he/she is still on the way. If it repeats in h7, he/she has reached the town but not home yet.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1, 3, 7, 9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const target = calc.resultFigure.dotPattern.join(',');
    const onTheWay = [3, 9].some((n) => CHECK_HOUSE(chart, n).figure.dotPattern.join(',') === target);
    const reachedTownNotHome = CHECK_HOUSE(chart, 7).figure.dotPattern.join(',') === target;
    const reachedHomeSafely = CHECK_DIRECTION(calc.resultFigure) === 'downward';

    const triggered = [reachedHomeSafely, onTheWay, reachedTownNotHome].filter(Boolean).length;
    if (triggered > 1) {
      return { outcome: 'uncertain', label: 'Conflicting conditions', interpretation: 'More than one of this method\'s stated conditions is satisfied at once, with no stated priority between them.' };
    }
    if (reachedHomeSafely) {
      return { outcome: 'descriptive', label: 'Reached home safely', interpretation: 'He/she has reached home safely.', descriptiveAnswer: 'reached-home' };
    }
    if (onTheWay) {
      return { outcome: 'descriptive', label: 'Still on the way', interpretation: 'He/she is still on the way.', descriptiveAnswer: 'on-the-way' };
    }
    if (reachedTownNotHome) {
      return { outcome: 'descriptive', label: 'Reached town, not home yet', interpretation: 'He/she has reached the town but not home yet.', descriptiveAnswer: 'reached-town' };
    }
    return { outcome: 'descriptive', label: 'Not reached yet', interpretation: 'He/she has not reached yet.', descriptiveAnswer: 'not-reached' };
  },
};

export const travellerReachedDestinationQuestion: QuestionDefinition = {
  id: 'if-the-traveller-has-reached-where-he-she',
  title: 'Has the traveller reached their destination?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
