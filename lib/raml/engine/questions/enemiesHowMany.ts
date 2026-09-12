// Source: Kanzul Mikban, Chapter 120 — "If You Have Enemies and How Many"
// (id "if-you-have-enemies-and-how-many"). Two independent methods.
// Method 1: whether Nuhu is anywhere in the chart at all, and how many
// times it repeats (reusing COUNT_FIGURE_OCCURRENCES, already used by
// chapter 79 Method 2). Method 2: a simple positive-trigger check at H12.
// resultKind 'descriptive': the question itself asks "how many," a count,
// not "is this good or bad for me."

import { CHECK_FIGURE_PRESENT_IN_CHART, CHECK_HOUSE, COUNT_FIGURE_OCCURRENCES, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';
import { getStarById } from '@/content/stars';

const CHAPTER_ID = 'if-you-have-enemies-and-how-many';

const method1: MethodDefinition = {
  id: 'enemies-how-many-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check if you see Nuhu in the chart. If it is there, it means you have enemies; but if it's not in the chart, it means you don't have enemies, or you have some but they cannot, or could not, do anything to you. The number of times it repeats is the number of enemies you have — if it repeats 3 times, you have 3 enemies; if 2 times, they are 2.",
  },
  calculate: (chart) => {
    const nuhu = getStarById('nuhu')!;
    const { trace } = CHECK_FIGURE_PRESENT_IN_CHART(chart, nuhu.pattern);
    return {
      housesUsed: [],
      steps: [trace.description],
      resultFigure: CHECK_HOUSE(chart, 1).figure, // representative reference figure only — this method has no single result house
    };
  },
  evaluate: (_calc, chart) => {
    const nuhu = getStarById('nuhu')!;
    const { count } = COUNT_FIGURE_OCCURRENCES(chart, nuhu.pattern);
    if (count === 0) {
      return { outcome: 'descriptive', label: 'No enemies', interpretation: "You don't have enemies, or you have some but they cannot do anything to you.", descriptiveAnswer: 'no-enemies' };
    }
    return { outcome: 'descriptive', label: `${count} enem${count === 1 ? 'y' : 'ies'}`, interpretation: `You have enemies — Nuhu repeats ${count} time(s), so you have ${count}.`, descriptiveAnswer: String(count) };
  },
};

const method2: MethodDefinition = {
  id: 'enemies-how-many-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Also: after casting the chart, check h12. If you get Musah, it means you have a lot of enemies in your life.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 12);
    return { housesUsed: [12], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'musah');
    return matches
      ? { outcome: 'descriptive', label: 'A lot of enemies', interpretation: 'You have a lot of enemies in your life.', descriptiveAnswer: 'a-lot' }
      : { outcome: 'uncertain', label: 'Not Musah at H12', interpretation: 'The source only defines the "Musah at H12" trigger — this is not addressed.' };
  },
};

export const enemiesHowManyQuestion: QuestionDefinition = {
  id: 'if-you-have-enemies-and-how-many',
  title: 'Do I have enemies, and how many?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
