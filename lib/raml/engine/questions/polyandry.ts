// Source: Kanzul Mikban, Chapter 73 — "If a Woman Has Married More Than
// One Man at the Same Time (Polyandry)" (id
// "if-a-woman-has-married-more-than-one"). One method: a single-house
// lookup that names all 16 of this system's figures individually (unlike
// most named-figure methods elsewhere, which only define a positive
// trigger for one or two figures and leave the rest uncertain) — fully
// computable and fully exhaustive, no branch left unaddressed. resultKind
// is 'descriptive': a categorical fact about marital history, not a
// favourable/unfavourable value judgment the source never makes.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-woman-has-married-more-than-one';

const FIGURE_MEANING: Record<string, { key: string; label: string }> = {
  ibrahim: { key: 'four-men', label: 'she has 4 men at the same time' },
  umar: { key: 'three-men', label: 'she has 3 men' },
  yunus: { key: 'three-men', label: 'she has 3 men' },
  adam: { key: 'five-men', label: 'she has 5 men' },
  'kalla-allahu': { key: 'five-men', label: 'she has 5 men' },
  usman: { key: 'one-man', label: 'she has just one man' },
  nuhu: { key: 'one-man', label: 'she has just one man' },
  iddris: { key: 'one-man', label: 'she has just one man' },
  musah: { key: 'two-brothers-one-died', label: 'she married two brothers from the same mother at the same time, and one has died, leaving one' },
  sulemana: { key: 'first-husband-died-before-remarriage', label: 'her first husband will die before she marries again' },
  ali: { key: 'one-man-died', label: 'she has married just one man and he died' },
  issah: { key: 'not-married', label: 'she has not married at all' },
  yussif: { key: 'two-men-different-families', label: 'she has married two men from different families' },
  mahadi: { key: 'two-men-different-families', label: 'she has married two men from different families' },
  'hassan-hussein': { key: 'two-men-different-families', label: 'she has married two men from different families' },
  ayuba: { key: 'two-men-different-families', label: 'she has married two men from different families' },
};

const method1: MethodDefinition = {
  id: 'polyandry-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check h7. If it's Ibrahim, it means she has 4 men at the same time. If it's Umar or Yunus, it means she has 3 men. If it's Adam or Kallah Allahu, it means she has 5 men. If it's Osman/Uthman, Nuhu, or Iddris, it means she has just one man. If it's Musah, it means she has married two brothers from the same mother at the same time, and one has died, leaving one. If it's Sulemana, it means her first husband will die before she marries again. If it's Ali, it means she has married just one man and he died. If it's Issah, it means she has not married at all. If it's Yusuf, Mahadi, Hassan and Hussein, or Ayuba, it means she has married two men from different families.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 7);
    return { housesUsed: [7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const meaning = FIGURE_MEANING[calc.resultFigure.figureId];
    return {
      outcome: 'descriptive',
      label: meaning.key.replace(/-/g, ' '),
      interpretation: meaning.label.charAt(0).toUpperCase() + meaning.label.slice(1) + '.',
      descriptiveAnswer: meaning.key,
    };
  },
};

export const polyandryQuestion: QuestionDefinition = {
  id: 'if-a-woman-has-married-more-than-one',
  title: 'How many men has she married at the same time?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
