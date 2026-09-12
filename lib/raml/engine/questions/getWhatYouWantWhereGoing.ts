// Source: Kanzul Mikban, Chapter 42 — "If You Will Get What You Want from
// Where You Are Going" (id "if-you-will-get-what-you-want-from"). Two
// methods, both fully computable from the good/middle-good/bad and
// upward/downward classifications this engine already carries — the
// bracketed "[figures omitted]" examples in Method 1's source text are
// illustrative only (it names EXAMPLE figures satisfying "good and
// downward"/"good and upward"), the rule itself is already defined
// generically by fortune/direction, so nothing here is blocked by the
// missing figure tokens.

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-what-you-want-from';

const method1: MethodDefinition = {
  id: 'get-what-you-want-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h4 and h15 and add them. If it's a good and downward star, it's good and you will be successful — if it's money or job, or a lady/man, that you want, it will be good and stable. If it's a good and upward star, you will get it but it won't be stable — it will leave you, or you will lose it as time goes on. If it's middle-good star, they will be tossing you up and down, or you will keep long before you get it. Forget it if it's a bad star — it won't work for you.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 15]);
    return { housesUsed: [4, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (fortune === 'good' && direction === 'downward') {
      return { outcome: 'favourable', label: 'Good and downward', interpretation: 'It is good and you will be successful — stable, whether money, a job, or a person.' };
    }
    if (fortune === 'good' && direction === 'upward') {
      return { outcome: 'mixed', label: 'Good and upward', interpretation: "You will get it, but it won't be stable — it will leave you, or you will lose it as time goes on." };
    }
    if (fortune === 'middleGood') {
      return { outcome: 'mixed', label: 'Middle-good', interpretation: 'They will be tossing you up and down, or you will keep long before you get it.' };
    }
    if (fortune === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad star', interpretation: "Forget it — it won't work for you." };
    }
    return { outcome: 'uncertain', label: 'Good, level', interpretation: 'This method only addresses a clearly upward or downward result for a good star.' };
  },
};

const method2: MethodDefinition = {
  id: 'get-what-you-want-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h1 and h5 and add them. If you get a good star, it's good to go; but if it's a bad star, don't go, please — it won't work for you.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: "It's good to go." };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: "Don't go, please — it won't work for you." };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

export const getWhatYouWantWhereGoingQuestion: QuestionDefinition = {
  id: 'if-you-will-get-what-you-want-from',
  title: 'Will I get what I want from where I am going?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
