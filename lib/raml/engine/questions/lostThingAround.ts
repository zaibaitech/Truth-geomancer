// Source: Kanzul Mikban, Chapter 10 — "If Your Lost Thing Is Still Around
// or Is Gone" (id "if-your-lost-thing-is-still-around-or"). A different
// question from chapter 18's "will I get my stolen things back"
// (questions/stolenThings.ts) — this one asks whether it's still nearby at
// all, not whether it'll be recovered — and has its own selectable
// intention, even though some of its methods happen to reuse the same
// house pairs. This chapter's own text goes on to a second sub-topic ("if
// you want to know if you will get your lost money back or not") with 4
// more methods, but that sub-topic has no intention id of its own in
// content/intentions.ts (a transcription artifact, not a separate
// question a user can select) — so only the 5 methods answering THIS
// chapter's own titled question are implemented here.
//
// Two of these methods (2 and 4) read the SAME direction axis with
// OPPOSITE polarity from each other — not a bug here, a genuine
// inconsistency in the source across methods of the same chapter, encoded
// faithfully rather than "corrected." This is exactly the kind of
// disagreement the engine's method-consensus reporting exists to surface.

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-lost-thing-is-still-around-or';

const method1: MethodDefinition = {
  id: 'lost-around-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h1 and h5 and add them. If your result is found in the chart, it's still around you or still in town. If it's not found in the chart, it's out of town.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: "It's still around you, or still in town." }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: "It's out of town." };
  },
};

const method2: MethodDefinition = {
  id: 'lost-around-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h5 and h16 and add them. If your result is an upward star, it's out of town; if it's a downward star, it's still around you.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 16]);
    return { housesUsed: [5, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = calc.resultFigure.qualities.direction.value;
    if (direction === 'upward') return { outcome: 'unfavourable', label: 'Upward', interpretation: "It's out of town." };
    if (direction === 'downward') return { outcome: 'favourable', label: 'Downward', interpretation: "It's still around you." };
    return { outcome: 'uncertain', label: 'Level (no clear direction)', interpretation: "This figure's top and bottom lines match, so this method's test doesn't resolve cleanly here." };
  },
};

const method3: MethodDefinition = {
  id: 'lost-around-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h8 and h9 and add them. If it's a downward star and also found in the chart, then you will get it back; but if it's a downward star and not found in the chart, you won't see it, though you may hear about it. If it's an upward star and found in the chart, you will hear about it.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [8, 9]);
    return { housesUsed: [8, 9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const direction = calc.resultFigure.qualities.direction.value;
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    if (direction === 'downward' && found) return { outcome: 'favourable', label: 'Downward, found', interpretation: 'You will get it back.' };
    if (direction === 'downward' && !found) return { outcome: 'mixed', label: 'Downward, not found', interpretation: "You won't see it, though you may hear about it." };
    if (direction === 'upward' && found) return { outcome: 'mixed', label: 'Upward, found', interpretation: 'You will hear about it.' };
    return {
      outcome: 'uncertain',
      label: 'Combination not addressed',
      interpretation: 'This method only covers downward+found, downward+not-found, and upward+found — this result falls outside all three.',
    };
  },
};

const method4: MethodDefinition = {
  id: 'lost-around-method-4',
  label: 'Method 4',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h5 and h6 and add them. If it's an upward star, you will get it; if it's a downward star, you won't get it again. Also, if it's in the chart you will see it; if it's not in the chart you won't see it again.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 6]);
    return { housesUsed: [5, 6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const direction = calc.resultFigure.qualities.direction.value;
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    const foundNote = found ? ' It is also in the chart, so you will see it.' : ' It is also not in the chart, so you will not see it again.';
    if (direction === 'upward') return { outcome: 'favourable', label: 'Upward', interpretation: `You will get it.${foundNote}` };
    if (direction === 'downward') return { outcome: 'unfavourable', label: 'Downward', interpretation: `You won't get it again.${foundNote}` };
    return {
      outcome: 'uncertain',
      label: 'Level (no clear direction)',
      interpretation: `This figure's top and bottom lines match, so this method's test doesn't resolve cleanly here.${foundNote}`,
    };
  },
};

const method5: MethodDefinition = {
  id: 'lost-around-method-5',
  label: 'Method 5',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Also, pick h1 and h7 and add them. If it's found in the chart, you will get it back; if it's not in the chart, you won't get it again.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7]);
    return { housesUsed: [1, 7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: 'You will get it back.' }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: "You won't get it again." };
  },
};

export const lostThingAroundQuestion: QuestionDefinition = {
  id: 'if-your-lost-thing-is-still-around-or',
  title: 'Is my lost thing still around, or gone?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3, method4, method5],
};
