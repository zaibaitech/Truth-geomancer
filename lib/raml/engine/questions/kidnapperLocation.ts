// Source: Kanzul Mikban, Chapter 142 — "Where Kidnappers Are Keeping a
// Person Hostage" (id "where-kidnappers-are-keeping-a-person-hostage").
//
// The final edition supplies twelve figure -> location outcomes
// (kanzulFinalEditionFigures.ts CH142_KIDNAP_LOCATION) and then ends with
// "...and so on, up to the end of the stars": Hassan & Hussein, Yunus, Usman and
// Musah have NO stated outcome and none is invented (source_incomplete).
//
// Held at `needs_review` (so no verdict is shown) for one further reason: the
// method says "check which star is found in its own house" but the source
// never states which house is a figure's "own". The twelve outcomes are listed
// in content/stars.ts numbering order, which suggests figure N's own house is
// house N, but that is an inference, not something the source says — so the
// outcome table is stored and wired up, and the verdict is withheld until the
// author confirms the "own house" rule.
// resultKind 'descriptive': locating a person is a factual answer.

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import { CH142_KIDNAP_LOCATION } from '../kanzulFinalEditionFigures';
import { STARS } from '@/content/stars';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'where-kidnappers-are-keeping-a-person-hostage';

/** Houses whose figure is the one numbered the same in STARS (INFERRED reading of "its own house"). */
function figuresInOwnHouse(chart: Parameters<MethodDefinition['calculate']>[0]) {
  return STARS.map((star) => ({ star, house: CHECK_HOUSE(chart, star.number) })).filter(({ star, house }) => house.figure.figureId === star.id);
}

const method1: MethodDefinition = {
  id: 'kidnapper-location-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewReasonCode: 'source_incomplete',
  reviewNote:
    'The final edition gives outcomes for only twelve figures and ends "and so on, up to the end of the stars" (Hassan & Hussein, Yunus, Usman and Musah have none), and it never states which house is a figure\'s "own house" — read here as the house with the figure\'s own STARS number, which is an inference awaiting the author\'s confirmation.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check which star is found in its own house. If it's: Yussif, he/she is kidnapped in his/her own house. If it's: Adam, he/she is in one of the closest houses, or a neighbor's. If it's Mahadi, he/she is in one of his/her family members' house. If it's Iddris, he/she is in his/her father's or mother's house. If it's Ibrahim, he/she is in one of his/her children's house. If it's Issah, he/she is in a sick person's house, close to him or her. If it's Umar, he/she is in his or her girlfriend's/boyfriend's, or wife's/husband's house. If it's Ayuba, he/she is in a funeral house. If it's Kalla Allahu, he/she is on a journey — they are taking him/her somewhere out of towns. If it's Sulemana, he/she is in a chief's, king's, or a well-known and respected person's house. If it's Ali, he/she is in his/her ex's house. If it's Nuhu, he/she is in his/her enemy's house — and so on, up to the end of the stars.",
  },
  calculate: (chart) => {
    const own = figuresInOwnHouse(chart);
    const ref = own[0]?.house ?? CHECK_HOUSE(chart, 1);
    return {
      housesUsed: own.map((o) => o.star.number),
      steps: own.length
        ? own.map((o) => `${o.star.name} is in its own house (H${o.star.number})`)
        : ['No figure is in its own house (read as: the house with the figure\'s own STARS number).'],
      resultFigure: ref.figure,
    };
  },
  evaluate: (calc) => {
    const entry = CH142_KIDNAP_LOCATION.entries.find((e) => e.figures.some((f) => MATCH_FIGURE(calc.resultFigure, f.starId)));
    if (!entry || calc.housesUsed.length === 0) {
      return {
        outcome: 'uncertain',
        label: calc.housesUsed.length === 0 ? 'No figure in its own house' : `${calc.resultFigure.figureName} in its own house`,
        interpretation: calc.housesUsed.length === 0 ? 'No figure is in its own house, so the source gives no location.' : 'The source gives no location for this figure (it ends "and so on, up to the end of the stars").',
      };
    }
    return {
      outcome: 'descriptive',
      label: `${calc.resultFigure.figureName} in its own house`,
      interpretation: `${entry.text.charAt(0).toUpperCase()}${entry.text.slice(1)}`,
      descriptiveAnswer: entry.figures.map((f) => f.starId).join('+'),
    };
  },
};

export const kidnapperLocationQuestion: QuestionDefinition = {
  id: 'where-kidnappers-are-keeping-a-person-hostage',
  title: 'Where are the kidnappers keeping the person?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
