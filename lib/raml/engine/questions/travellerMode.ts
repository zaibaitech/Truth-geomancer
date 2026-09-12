// Source: Kanzul Mikban, Chapter 135 — "If the Traveller Has Travelled by
// Air, Water, or Land" (id "if-the-traveller-has-travelled-by-air-water").
// One method: count every house's element across the whole chart
// (COUNT_ELEMENTS), then compare the air/water/sand tallies only — the
// source deliberately excludes fire from this three-way comparison (no
// "fire = travelled by X" is ever stated). Whichever of air/water/sand has
// strictly the most wins; a tie among the top count is not addressed.
// resultKind 'descriptive': a mode of travel, not a favourable/unfavourable
// outcome.

import { CHECK_HOUSE, COUNT_ELEMENTS } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-traveller-has-travelled-by-air-water';

const method1: MethodDefinition = {
  id: 'traveller-mode-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, count all the dots of the air elements, the dots of the water elements, and the dots of the sand elements, and check which one has more dots. If the air dots are more, he/she travelled by air. If the water dots are more, he/she travelled by water. If the sand dots are more, he/she travelled by car, train, motorbike, or bicycle, etc.',
  },
  calculate: (chart) => {
    const tally = COUNT_ELEMENTS(chart);
    const { figure } = CHECK_HOUSE(chart, 1); // representative reference figure only — this method compares element counts, not a single figure
    return {
      housesUsed: [],
      steps: [`Element tally: air=${tally.air}, water=${tally.water}, sand=${tally.sand} (fire not compared)`],
      resultFigure: figure,
    };
  },
  evaluate: (_calc, chart) => {
    const tally = COUNT_ELEMENTS(chart);
    const max = Math.max(tally.air, tally.water, tally.sand);
    const winners = (['air', 'water', 'sand'] as const).filter((e) => tally[e] === max);
    if (winners.length > 1) {
      return { outcome: 'uncertain', label: 'Tied element count', interpretation: `Air=${tally.air}, water=${tally.water}, sand=${tally.sand} — no single element has strictly the most; the source does not address a tie.` };
    }
    const winner = winners[0];
    if (winner === 'air') {
      return { outcome: 'descriptive', label: 'Travelled by air', interpretation: `Air houses (${tally.air}) outnumber water (${tally.water}) and sand (${tally.sand}) — he/she travelled by air.`, descriptiveAnswer: 'air' };
    }
    if (winner === 'water') {
      return { outcome: 'descriptive', label: 'Travelled by water', interpretation: `Water houses (${tally.water}) outnumber air (${tally.air}) and sand (${tally.sand}) — he/she travelled by water.`, descriptiveAnswer: 'water' };
    }
    return { outcome: 'descriptive', label: 'Travelled by land', interpretation: `Sand houses (${tally.sand}) outnumber air (${tally.air}) and water (${tally.water}) — he/she travelled by car, train, motorbike, bicycle, etc.`, descriptiveAnswer: 'land' };
  },
};

export const travellerModeQuestion: QuestionDefinition = {
  id: 'if-the-traveller-has-travelled-by-air-water',
  title: 'Did the traveller go by air, water, or land?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
