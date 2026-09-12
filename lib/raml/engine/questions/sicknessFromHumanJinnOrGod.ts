// Source: Kanzul Mikban, Chapter 104 — "If the Sickness Is from Human,
// Jinn, or God Almighty" (id "if-the-sickness-is-from-human-jinn-or"). One
// method, full good/middle-good/bad coverage. resultKind 'descriptive': a
// cause attribution, not itself favourable/unfavourable — same reasoning
// as chapter 84 (enmity origin) and chapter 98 (cause of death).
//
// The unnumbered "Additional Method — If a Sick Person Has Long Life
// (repeated again in the notebook)" fragment that immediately follows
// this chapter is a confirmed, word-for-word duplicate of chapter 96
// Method 1 (h1+h9, air element opened/closed -> long life/no long life)
// — its own title says "repeated again," and this is the THIRD
// occurrence of this exact rule in the manuscript (after ch.96 M1 itself
// and the "repeated" fragment already consolidated there in Prompt 9). It
// is not registered as a separate question or method here.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-sickness-is-from-human-jinn-or';

const method1: MethodDefinition = {
  id: 'sickness-cause-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h4, h6, h5, and h8 and add them. If the result is a good star, it's from God. If it's a bad star, it's from jinn. If it is a middle-good star, it is from a human being.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 6, 5, 8]);
    return { housesUsed: [4, 5, 6, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'descriptive', label: 'From God', interpretation: "It's from God.", descriptiveAnswer: 'god' };
    if (fortune === 'bad') return { outcome: 'descriptive', label: 'From jinn', interpretation: "It's from jinn.", descriptiveAnswer: 'jinn' };
    return { outcome: 'descriptive', label: 'From a human being', interpretation: 'It is from a human being.', descriptiveAnswer: 'human' };
  },
};

export const sicknessFromHumanJinnOrGodQuestion: QuestionDefinition = {
  id: 'if-the-sickness-is-from-human-jinn-or',
  title: 'Where does this sickness come from?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
