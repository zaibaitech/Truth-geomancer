// Source: Kanzul Mikban, Chapter 18 — "If You Will Get Your Stolen Things
// Back" (content/manuscripts/kanzul-mikban.ts, id
// "if-you-will-get-your-stolen-things-back"). The chapter's "Part A — If
// they will steal you" methods answer a different question (theft risk, not
// recovery) and two of its three methods depend on omitted figures anyway,
// so only "Part B — If you will get your stolen things back" is used here.
//
// Prompt 6 audit finding: Method 3's own source text names TWO independent
// rules for the same h2+h6+h9+h16 calculation — the book's own primary
// "found in the chart" rule, and a second, explicitly-attributed rule
// ("Some scholars also say...", verbatim in the source) giving a more
// detailed good/bad x upward/downward breakdown. The previous version of
// this file folded the scholars' rule into cosmetic elaboration text
// appended to the primary rule's own favourable/unfavourable verdict,
// rather than counting it as its own method — so a "good but upward" result
// (which the scholars' rule itself calls a `mixed` case: "you might not get
// them") could never actually surface as anything but a flat favourable/
// unfavourable verdict from the primary rule. Split into Method 3 (primary
// rule only) and Method 4 (the scholars' rule, independently computed and
// counted toward consensus) — this is exactly the "preserve every method
// independently, never merge distinct traditional methods into one
// algorithm" principle, applied retroactively to a case the earlier stage
// missed. Both methods still combine the same houses (the source names the
// identical calculation for both), so Method 4 reuses Method 3's own
// calculate().

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-your-stolen-things-back';

const method1: MethodDefinition = {
  id: 'stolen-method-1',
  label: 'Method 1 (Part B)',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1 and h5 and add them. If your result is found in the chart, you will see them, or it's not gone far from you and you can still get them; but if it's not found in the chart, you won't see them again.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: "You will see them, or they haven't gone far — you can still get them." }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: "You won't see them again." };
  },
};

const method2: MethodDefinition = {
  id: 'stolen-method-2',
  label: 'Method 2 (Part B)',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h7 and h8 and add them. If it's a downward star, you will get them back; but if it's an upward star, you won't get them again.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [7, 8]);
    return { housesUsed: [7, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = calc.resultFigure.qualities.direction.value;
    if (direction === 'downward') return { outcome: 'favourable', label: 'Downward', interpretation: 'You will get them back.' };
    if (direction === 'upward') return { outcome: 'unfavourable', label: 'Upward', interpretation: "You won't get them again." };
    return {
      outcome: 'uncertain',
      label: 'Level (no clear direction)',
      interpretation: "This figure's top and bottom lines match, so this method's upward/downward test doesn't resolve cleanly here.",
    };
  },
};

const method3: MethodDefinition = {
  id: 'stolen-method-3',
  label: 'Method 3 (Part B)',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h2, h6, h9 and h16 and add them. If your result is found in the chart, you will get them; if it's not found in the chart, you won't see them again.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [2, 6, 9, 16]);
    return { housesUsed: [2, 6, 9, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: 'You will get them.' }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: "You won't see them again." };
  },
};

// The same source paragraph (Method 3's own quote, continued) attributes a
// second, more detailed rule to "some scholars" — the exact same h2+h6+h9+
// h16 calculation, but decided by fortune x direction instead of chart
// presence. Registered as its own method (Prompt 6 fix) rather than folded
// into Method 3's verdict, so a genuine disagreement between the two rules
// (e.g. the primary rule finds it in the chart, but the scholars' rule
// lands on "good and upward" — "you might not get them") surfaces honestly
// through consensus instead of being silently dropped as flavor text.
const method4: MethodDefinition = {
  id: 'stolen-method-4',
  label: 'Method 4 (Part B, "some scholars")',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Some scholars also say that after picking h2, h6, h9 and h16 and adding them: if you get a good and downward star, you will get them back peacefully. If it's a good and upward star, you will hear about them but you might not get them. If it's a middle-good or bad star, upward or downward, you won't get them back.",
  },
  calculate: method3.calculate,
  evaluate: (calc) => {
    const { fortune, direction } = calc.resultFigure.qualities;
    if (fortune.value === 'good' && direction.value === 'downward') {
      return { outcome: 'favourable', label: 'Good and downward', interpretation: 'You will get them back peacefully.' };
    }
    if (fortune.value === 'good' && direction.value === 'upward') {
      return { outcome: 'mixed', label: 'Good and upward', interpretation: 'You will hear about them, but you might not get them.' };
    }
    if (fortune.value === 'middleGood' || fortune.value === 'bad') {
      return { outcome: 'unfavourable', label: fortune.value === 'middleGood' ? 'Middle-good' : 'Bad', interpretation: "You won't get them back." };
    }
    return { outcome: 'uncertain', label: 'Combination not addressed', interpretation: "This method's wording covers good+downward, good+upward, and middle-good-or-bad — this result falls outside all three." };
  },
};

export const stolenThingsQuestion: QuestionDefinition = {
  id: 'if-you-will-get-your-stolen-things-back',
  title: 'Will I get my stolen or lost things back?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3, method4],
};
