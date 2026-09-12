// Source: Kanzul Mikban, the unnumbered "Sub-topic: If She's Going to Stay in
// the Marriage or Not" fragment that follows chapter 7 (id
// "if-she-s-going-to-stay-in-the").
//
// PROMPT 13 COVERAGE FINDING: this fragment is fully computable and already
// has its own selectable entry in content/intentions.ts, but was never
// registered — every earlier stage scoped itself to a NUMBERED chapter range
// (1-19, 20-40, ...) and this fragment carries no chapter number, so it fell
// between stages rather than being deliberately excluded. With the book now
// complete, the final coverage audit closes that gap. Nothing here is new
// source material: both methods are implemented exactly as the fragment
// states them, using only existing primitives.
//
// Distinct from the similarly-titled "If She/He Is Still in the Marriage"
// fragment after chapter 66 (stillInMarriage.ts), which asks whether the
// marriage is currently intact via a different calculation (h5+h9+h10+h11,
// found-in-chart). This one asks whether she will REMAIN in it going
// forward, via h9+h8 direction and a separate fortune x direction reading.
//
// resultKind 'outcome': the source frames both methods in terms of the
// querent's own stakes (staying/leaving, enjoying or not enjoying the stay).

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-she-s-going-to-stay-in-the';

const method1: MethodDefinition = {
  id: 'stay-in-marriage-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Method 1: Pick h9 and h8 and add them. If you get an upward star, she will not stay forever; if it's a downward star, she will stay, insha'Allah.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [9, 8]);
    return { housesUsed: [8, 9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'downward') {
      return { outcome: 'favourable', label: 'Downward', interpretation: 'She will stay, insha’Allah.' };
    }
    if (direction === 'upward') {
      return { outcome: 'unfavourable', label: 'Upward', interpretation: 'She will not stay forever.' };
    }
    return { outcome: 'uncertain', label: 'Level star', interpretation: 'The resulting figure is neither clearly upward nor downward — this method only addresses those two.' };
  },
};

const method2: MethodDefinition = {
  id: 'stay-in-marriage-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Method 2: Pick (h2 and h7) then (h4 and h10), add them all, and check: if it's a good and downward star, she will stay and enjoy the stay. If it's a good and upward star, she will leave even though she enjoys the stay. If it's a bad and downward star, she will not enjoy the stay and will also not leave. If it's a bad and upward star, she will leave immediately because she will not enjoy her stay, and will leave faster than expected.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [2, 7, 4, 10]);
    return { housesUsed: [2, 4, 7, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (fortune === 'good' && direction === 'downward') {
      return { outcome: 'favourable', label: 'Good and downward', interpretation: 'She will stay and enjoy the stay.' };
    }
    if (fortune === 'good' && direction === 'upward') {
      return { outcome: 'mixed', label: 'Good and upward', interpretation: 'She will leave even though she enjoys the stay.' };
    }
    if (fortune === 'bad' && direction === 'downward') {
      return { outcome: 'mixed', label: 'Bad and downward', interpretation: 'She will not enjoy the stay, and will also not leave.' };
    }
    if (fortune === 'bad' && direction === 'upward') {
      return { outcome: 'unfavourable', label: 'Bad and upward', interpretation: 'She will leave immediately because she will not enjoy her stay, and will leave faster than expected.' };
    }
    return { outcome: 'uncertain', label: 'Middle-good, or level', interpretation: 'This method only addresses good/bad crossed with upward/downward — this is not addressed.' };
  },
};

export const stayInMarriageQuestion: QuestionDefinition = {
  id: 'if-she-s-going-to-stay-in-the',
  title: 'Will she stay in the marriage?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
