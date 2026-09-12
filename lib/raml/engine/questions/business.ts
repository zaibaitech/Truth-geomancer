// Source: Kanzul Mikban, Chapter 3 — "Business, Profit, and Loss"
// (content/manuscripts/kanzul-mikban.ts, id "business-profit-and-loss").

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'business-profit-and-loss';

const method1: MethodDefinition = {
  id: 'business-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick (h1 and h5) then (h4 and h6). Add all and check: if it's a good star, you will get a lot of profit; if it's a bad star, you won't get any profit.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5, 4, 6]);
    return { housesUsed: [1, 5, 4, 6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: 'You will get a lot of profit.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad', interpretation: "You won't get any profit." };
    return {
      outcome: 'uncertain',
      label: 'Middle-good (not addressed by this method)',
      interpretation: "This method only distinguishes good from bad; a middle-good result like this one isn't covered by its own wording.",
    };
  },
};

const method2: MethodDefinition = {
  id: 'business-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick (h2 and h6), (h11 and h13), and add them. Then add the result to h16. If you get a good star and it's also found in the chart, you will get more profit from the business. If it's a good star but not found in the chart, it means you will go and come in peace but you will not get any profit. If it's a bad star, it means it's not good to travel at all or embark on that business trip.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [2, 6, 11, 13]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 16);
    return { housesUsed: [2, 6, 11, 13, 16], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc, chart) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad', interpretation: "It's not good to travel at all or embark on that business trip." };
    }
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    if (fortune === 'good' && found) {
      return { outcome: 'favourable', label: 'Good, found in the chart', interpretation: 'You will get more profit from the business.' };
    }
    if (fortune === 'good' && !found) {
      return {
        outcome: 'mixed',
        label: 'Good, not found in the chart',
        interpretation: 'You will go and come in peace, but you will not get any profit.',
      };
    }
    return {
      outcome: 'uncertain',
      label: 'Middle-good (not addressed by this method)',
      interpretation: "This method only spells out good and bad results; a middle-good one isn't covered by its own wording.",
    };
  },
};

// The source's own paragraph break for Method 3 lands mid-sentence in the
// transcription (a PDF-chunking artifact — the chapter's array holds
// "Method 3:" and its actual instruction as two separate strings). The
// instruction itself also under-specifies what happens when h2 and h6
// disagree (one good, one bad) or land middle-good, so per this project's
// source-fidelity rule this stays needs_review rather than guessed at.
const method3: MethodDefinition = {
  id: 'business-method-3',
  label: 'Method 3',
  status: 'needs_review',
  reviewNote:
    "The chapter only spells out the two extremes — both h2 and h6 bad, or (implicitly) both good — and never says what a mixed or middle-good pair means. Rather than invent a rule for those cases, the whole method is left unverified, so it never contributes a verdict: H2 and H6 are shown, but no outcome is read from them even on the two charts the source does address.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Also, after drawing the chart, check h2 and h6 — if you see a bad star in both houses, it means it's not good; but if it's a good star, it's good to embark on the business trip.",
  },
  calculate: (chart) => {
    const h2 = CHECK_HOUSE(chart, 2);
    const h6 = CHECK_HOUSE(chart, 6);
    return {
      housesUsed: [2, 6],
      steps: [h2.trace.description, h6.trace.description],
      resultFigure: h2.figure, // no combined figure for this method — h2 shown as the primary reference
    };
  },
  evaluate: (_calc, chart) => {
    const h2 = chart.houses[1].qualities.fortune.value;
    const h6 = chart.houses[5].qualities.fortune.value;
    if (h2 === 'bad' && h6 === 'bad') {
      return { outcome: 'unfavourable', label: 'Both bad', interpretation: "It's not good to embark on the business trip." };
    }
    if (h2 === 'good' && h6 === 'good') {
      return { outcome: 'favourable', label: 'Both good', interpretation: "It's good to embark on the business trip." };
    }
    return {
      outcome: 'uncertain',
      label: 'Mixed or middle-good result',
      interpretation: "H2 and H6 don't both agree, and the source doesn't say what that means — this method doesn't give a confident answer here.",
    };
  },
};

export const businessQuestion: QuestionDefinition = {
  id: 'business-profit-and-loss',
  title: 'Business, profit, and loss',
  categoryId: 'money-possessions',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3],
};
