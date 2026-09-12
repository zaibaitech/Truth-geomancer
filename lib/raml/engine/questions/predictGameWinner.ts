// Source: Kanzul Mikban, Chapter 37 — "How to Predict a Game, Who Will Win
// or Lose" (id "how-to-predict-a-game-who-will-win"). Two methods. Method 2
// depends on which physical SIDE of the drawn chart ("right" vs. "left") a
// figure lands on — a spatial layout concept this project's ChartModel has
// never encoded anywhere (house numbers 1-16 carry no left/right position);
// implementing it would mean inventing a spatial convention the codebase
// doesn't define, so it stays `uncertain` for that architectural reason,
// distinct from an omitted-figure problem.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'how-to-predict-a-game-who-will-win';

const FORTUNE_RANK: Record<'bad' | 'middleGood' | 'good', number> = { bad: 0, middleGood: 1, good: 2 };

const method1: MethodDefinition = {
  id: 'game-winner-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, put your team on the right side of the chart and your opponent's team on the left. After that, use h1 as your team and h2 as the other team. If h1 is a good star more than h2, it means your team will win; but if it's a bad star, it will not. If they are all good stars, it means both teams will score a draw. If they are all middle-good or bad stars, there will be a goalless draw or no win.",
  },
  calculate: (chart) => {
    const yourTeam = CHECK_HOUSE(chart, 1);
    const opponent = CHECK_HOUSE(chart, 2);
    return {
      housesUsed: [1, 2],
      steps: [yourTeam.trace.description, opponent.trace.description],
      resultFigure: yourTeam.figure,
    };
  },
  evaluate: (_calc, chart) => {
    const h1 = chart.houses[0].qualities.fortune.value;
    const h2 = chart.houses[1].qualities.fortune.value;
    if (!h1 || !h2) {
      return { outcome: 'uncertain', label: 'Fortune not available', interpretation: 'This method needs both houses\' fortune to compare.' };
    }
    const rank1 = FORTUNE_RANK[h1];
    const rank2 = FORTUNE_RANK[h2];
    if (rank1 > rank2) return { outcome: 'favourable', label: `H1 (${h1}) beats H2 (${h2})`, interpretation: 'Your team will win.' };
    if (rank1 < rank2) return { outcome: 'unfavourable', label: `H1 (${h1}) loses to H2 (${h2})`, interpretation: 'Your team will not win.' };
    if (h1 === 'good') return { outcome: 'mixed', label: 'Both good stars', interpretation: 'Both teams will score a draw.' };
    return { outcome: 'mixed', label: `Both ${h1} stars`, interpretation: 'There will be a goalless draw or no win.' };
  },
};

const method2: MethodDefinition = {
  id: 'game-winner-method-2',
  label: 'Method 2',
  status: 'uncertain',
  reviewNote:
    'This method decides the verdict by which physical side ("right" or "left") of the drawn chart a synthesized figure lands on. This project\'s ChartModel has no left/right spatial layout concept for its 16 houses — implementing this would mean inventing a spatial convention the codebase and source transcription do not define, rather than reading one that already exists. Not implemented rather than guessed.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 fire element, h2 air element, h3 water element and h4 sand element and form a star. Check where you can locate it in the chart. If it's on the right side, your team will win; but if it's not, your team may lose.",
  },
  calculate: () => {
    throw new Error('This method requires a left/right spatial layout of the chart, which this project\'s ChartModel does not encode.');
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
};

export const predictGameWinnerQuestion: QuestionDefinition = {
  id: 'how-to-predict-a-game-who-will-win',
  title: 'Who will win this game?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
