// Source: Kanzul Mikban, Chapter 98 — "The Causes of Someone's Death" (id
// "the-causes-of-someone-s-death"). One method: check h8, then see which
// OTHER house its own figure repeats in — each house 1-12 has its own
// named cause, and h13-h16 explicitly repeat h1-h4's own meanings
// respectively. Fully computable. The source doesn't say what happens if
// h8's figure repeats at more than one other house, or nowhere else at
// all — both left `uncertain` rather than guessed (only an exactly-one
// match resolves). resultKind 'descriptive': a cause attribution, not
// itself a value judgment.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-causes-of-someone-s-death';

const CAUSES: Record<number, { label: string; answer: string; text: string }> = {
  1: { label: 'By him/herself', answer: 'self', text: 'through him/herself (suicide, by hanging, food poisoning, shooting him/herself, etc.).' },
  2: { label: 'Money', answer: 'money', text: 'because of money, or through money.' },
  3: { label: 'Family', answer: 'family', text: "through his/her family members or close relatives." },
  4: { label: 'Lands or chieftaincy', answer: 'lands-or-chieftaincy', text: 'because of lands and properties, or chieftaincy titles.' },
  5: { label: 'Love or children', answer: 'love-or-children', text: 'through love or relationships and children.' },
  6: { label: 'Slavery or friendship', answer: 'slavery-or-friendship', text: 'through slavery, having been a servant, or friendships.' },
  7: { label: 'Rivalry in marriage', answer: 'rivalry-in-marriage', text: 'through rivalry, jealousy, and enviousness in a relationship/marriage.' },
  8: { label: 'Fear, inheritance, or danger', answer: 'fear-inheritance-or-danger', text: 'out of fear, inheritance, or risk/danger.' },
  9: { label: 'Travel, business, or knowledge', answer: 'travel-business-or-knowledge', text: 'through travelling, business, knowledge-seeking, or lottery.' },
  10: { label: 'Kingship or job', answer: 'kingship-or-job', text: 'through kingship or chieftaincy issues, cases, or job searching.' },
  11: { label: 'Friendship or expectations', answer: 'friendship-or-expectations', text: 'through friendship and lovers, or expectations.' },
  12: { label: 'Enmity and friendship', answer: 'enmity-and-friendship', text: 'through enmity and friendship.' },
};

function causeHouse(n: number): number {
  return n >= 13 ? n - 12 : n; // h13-h16 repeat h1-h4's own meanings
}

const method1: MethodDefinition = {
  id: 'causes-of-death-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, check h8. If the star repeats in h1, it means one will die by him/herself... If it repeats in h2, money... [full 12-way house lookup, h13-h16 repeating h1-h4 respectively].',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 8);
    return { housesUsed: [8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const target = calc.resultFigure.dotPattern.join(',');
    const matches: number[] = [];
    for (let n = 1; n <= 16; n++) {
      if (n === 8) continue;
      const { figure } = CHECK_HOUSE(chart, n);
      if (figure.dotPattern.join(',') === target) matches.push(n);
    }
    if (matches.length === 0) {
      return { outcome: 'uncertain', label: "H8's figure repeats nowhere else", interpretation: "The source only addresses H8's figure repeating elsewhere — this is not addressed." };
    }
    if (matches.length > 1) {
      return { outcome: 'uncertain', label: `H8's figure repeats at ${matches.length} other houses`, interpretation: "The source assumes a single repeat — which cause applies when it repeats more than once is not addressed." };
    }
    const cause = CAUSES[causeHouse(matches[0])];
    return { outcome: 'descriptive', label: cause.label, interpretation: `H8's own figure repeats at H${matches[0]}: ${cause.text}`, descriptiveAnswer: cause.answer };
  },
};

export const causesOfDeathQuestion: QuestionDefinition = {
  id: 'the-causes-of-someone-s-death',
  title: 'What will the cause of death be?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
