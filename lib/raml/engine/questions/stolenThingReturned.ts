// Source: Kanzul Mikban, Chapter 125 — "If They Will Return a Stolen Thing
// Back" (id "if-they-will-return-a-stolen-thing-back"). One method, but a
// genuine multi-branch decision tree spanning h1, h2, h7 and h8's fortune
// classification (all verified — good/middleGood/bad):
//
//   A. h1 good AND h2 good AND h7 bad AND h8 bad -> will get it back.
//   B. h7 good AND h8 good AND h1 bad AND h2 bad -> won't get it back.
//   C. otherwise, if at least one of the four is bad or middle-good, fall
//      back to checking h2 alone: good -> will get it back; bad -> won't.
//      (h2 = middle-good in this fallback is not addressed by the source.)
//   D. the residual case where none of A, B, or C's own trigger condition
//      is literally met (e.g. all four are good, which satisfies neither A
//      — that needs h7/h8 bad — nor C's own "at least one bad/middle-good"
//      trigger) is not addressed either.
//
// Every branch is implemented literally; D and C's own h2-middle-good case
// are left uncertain rather than folded into a guessed neighbor. resultKind
// 'outcome': the source explicitly frames this in terms of personal benefit
// ("you will get the stolen thing back" / "you won't get it again").

import { CHECK_HOUSE } from '../operations';
import type { ComputedFigure, MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-they-will-return-a-stolen-thing-back';

function fortune(figure: ComputedFigure) {
  return figure.qualities.fortune.value;
}

const method1: MethodDefinition = {
  id: 'stolen-thing-returned-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check h1 and h2. If they are both good stars, then check h7 and h8 — if they are bad stars, it means you will get the stolen thing back. But if h7 and h8 are good stars and h1 and h2 are bad stars, you won't get it again. If one of the stars in (h1 and h2) or (h7 and h8) is a bad or middle-good star, then check h2 — if it's a good star, it will be brought back; but if it's a bad star, they won't bring it back.",
  },
  calculate: (chart) => {
    const h1 = CHECK_HOUSE(chart, 1);
    const h2 = CHECK_HOUSE(chart, 2);
    const h7 = CHECK_HOUSE(chart, 7);
    const h8 = CHECK_HOUSE(chart, 8);
    return {
      housesUsed: [1, 2, 7, 8],
      steps: [h1.trace.description, h2.trace.description, h7.trace.description, h8.trace.description],
      resultFigure: h2.figure, // representative reference — h2 is the fallback deciding house
    };
  },
  evaluate: (_calc, chart) => {
    const h1 = fortune(CHECK_HOUSE(chart, 1).figure);
    const h2 = fortune(CHECK_HOUSE(chart, 2).figure);
    const h7 = fortune(CHECK_HOUSE(chart, 7).figure);
    const h8 = fortune(CHECK_HOUSE(chart, 8).figure);

    if (h1 === 'good' && h2 === 'good' && h7 === 'bad' && h8 === 'bad') {
      return { outcome: 'favourable', label: 'H1/H2 good, H7/H8 bad', interpretation: 'You will get the stolen thing back.' };
    }
    if (h7 === 'good' && h8 === 'good' && h1 === 'bad' && h2 === 'bad') {
      return { outcome: 'unfavourable', label: 'H7/H8 good, H1/H2 bad', interpretation: "You won't get it back." };
    }
    const anyBadOrMiddle = [h1, h2, h7, h8].some((v) => v === 'bad' || v === 'middleGood');
    if (anyBadOrMiddle) {
      if (h2 === 'good') {
        return { outcome: 'favourable', label: 'Fallback: H2 good', interpretation: 'It will be brought back.' };
      }
      if (h2 === 'bad') {
        return { outcome: 'unfavourable', label: 'Fallback: H2 bad', interpretation: "They won't bring it back." };
      }
      return { outcome: 'uncertain', label: 'Fallback: H2 middle-good', interpretation: 'The fallback rule only addresses H2 as good or bad — middle-good is not addressed.' };
    }
    return { outcome: 'uncertain', label: 'No stated branch applies', interpretation: 'Neither the clean H1/H2-vs-H7/H8 split nor the fallback trigger condition is met by this chart.' };
  },
};

export const stolenThingReturnedQuestion: QuestionDefinition = {
  id: 'if-they-will-return-a-stolen-thing-back',
  title: 'Will the stolen thing be returned?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
