// Source: Kanzul Mikban, Chapter 21 — "If Your Wife or Sister Has Had Sex or
// Not" (id "if-your-wife-or-sister-has-had-sex"). Three methods, three very
// different fidelity outcomes: Method 1 asks for a whole-FIGURE "opened/
// closed" classification this project has no verified definition for (same
// unresolved gap as chapter 1's own "single-dot star" method — needs_review,
// not guessed); Method 2 asks for one specific LINE's state, which IS
// manuscript-defined and fully computable; Method 3 depends entirely on
// named figures the source transcription omitted.
//
// Prompt 6 audit: this question predates the `resultKind: 'descriptive'`
// model (built in Prompt 4.5, one stage after this file was written in
// Prompt 2) and was never migrated. Whether sex occurred is a factual
// yes/no answer — the source attaches no favourable/unfavourable value
// judgment to either branch, exactly the same shape as chapter 58's "if
// couples have had sex or not" (couplesHadSex.ts), which correctly uses the
// descriptive model. This is a genuine implementation inconsistency, not a
// different source rule or an architectural limitation — Method 2's own
// calculation is unchanged, only its result kind and outcome labeling are
// migrated to match chapter 58's more considered treatment, with regression
// tests confirming the fixture-chart calculation itself never changed.

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, CHECK_LINE_STATE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-wife-or-sister-has-had-sex';

const method1: MethodDefinition = {
  id: 'wife-sex-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewReasonCode: 'whole_figure_state_undefined',
  reviewNote:
    "The verdict hinges on classifying the WHOLE resulting figure as \"opened\" or \"closed\" — this project only has a verified opened/closed definition per individual LINE (fire/air/water/sand), not for a whole 4-line figure, same unresolved gap as chapter 1's Method 3. The houses and resulting figure are shown; the verdict is withheld rather than guessed at a whole-figure classification this codebase doesn't define.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h6 and h16 and add them. Add the result to h7 and check if it's an opened star — she does have sex; but if it's a closed star, she didn't.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [6, 16]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 7);
    return { housesUsed: [6, 16, 7], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Whole-figure opened/closed not defined',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

const method2: MethodDefinition = {
  id: 'wife-sex-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h7 and h13 and add them. If the star's water line is active (water element is opened, meaning single dot), she does have sex; but if it's closed, she didn't.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [7, 13]);
    return { housesUsed: [7, 13], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const opened = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'opened';
    return opened
      ? { outcome: 'descriptive', label: 'Had sex', interpretation: 'The water line is opened (single dot) — she does have sex.', descriptiveAnswer: 'yes' }
      : { outcome: 'descriptive', label: "Didn't", interpretation: "The water line is closed — she didn't.", descriptiveAnswer: 'no' };
  },
};

const method3: MethodDefinition = {
  id: 'wife-sex-method-3',
  label: 'Method 3',
  status: 'uncertain',
  reviewReasonCode: 'figures_omitted_by_transcription',
  reviewNote:
    'The verdict depends on checking H7 against two lists of named figures, both transcribed as "[figures omitted — symbols not preserved]". Not implemented rather than guessed.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart with your intention, check h7. If you see [figures omitted — symbols not preserved in this transcription] it means she does or he does have sex; but if it's: [figures omitted — symbols not preserved in this transcription] she didn't.",
  },
  calculate: () => {
    throw new Error('Method 3 depends on named figures the source transcription omitted for both branches.');
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
};

export const wifeSisterHadSexQuestion: QuestionDefinition = {
  id: 'if-your-wife-or-sister-has-had-sex',
  title: 'Has my wife or sister had sex?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2, method3],
};
