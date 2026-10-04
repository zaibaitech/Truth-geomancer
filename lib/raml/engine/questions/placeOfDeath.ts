// Source: Kanzul Mikban, Chapter 97 — "Where One Will Die (Place of
// Death)" (id "where-one-will-die-place-of-death"). One method: check h8 and
// read off the place for the figure found there. The fourteen outcomes cover
// all sixteen figures (two outcomes name two figures each) and were restored
// from the author-confirmed final edition (see ../kanzulFinalEditionFigures.ts).
// resultKind 'descriptive': a place is a factual answer.

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import { CH97_PLACE_OF_DEATH } from '../kanzulFinalEditionFigures';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'where-one-will-die-place-of-death';

const method1: MethodDefinition = {
  id: 'place-of-death-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check h8. If it is Mahadi or Adam, one will die in his/her hometown, in a masjid/mosque, or where they teach Qur'an (Makaranta). If it is Usman, one will die in his/her hometown, the same day, with a scholar or well-known person in your town. If it is Hassan & Hussein, one will die in a village or on mountains. If it is Ali or Musah, it means one will die in a farm or bush. If it is Yussif, one will die in a very rich or wealthy place, or a rainy or watery place. If it is Sulemana, one will die in a place where they break stone, or in mountains. If it is Ayuba, one will die in an old shrine, or a damaged or dirty place. If it is Umar, one will die in a fearful or robbery-prone place. If it is Iddris, one will die in a peaceful or joyful place, or around a river or sea. If it is Kalla Allahu, one will die in a big town or city — a well-respected, well-arranged place. If it is Nuhu, one will die in a palace, a flagstaff house, or where there is a river. If it is Issah, one will die in a damaged place, a place of war, or among animals. If it is Yunus, one will die in a place of knowledge, a joyful place, cool, or where there are a lot of trees. If it is Ibrahim, one will die in a waterlogged area, or where water runs — a cool and peaceful place.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 8);
    return { housesUsed: [8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const entry = CH97_PLACE_OF_DEATH.entries.find((e) => e.figures.some((f) => MATCH_FIGURE(calc.resultFigure, f.starId)));
    if (!entry) {
      return { outcome: 'uncertain', label: `${calc.resultFigure.figureName} at H8`, interpretation: 'The source gives no place of death for this figure.' };
    }
    return {
      outcome: 'descriptive',
      label: `${calc.resultFigure.figureName} at H8`,
      interpretation: `${entry.text.charAt(0).toUpperCase()}${entry.text.slice(1)}`,
      descriptiveAnswer: entry.figures.map((f) => f.starId).join('+'),
    };
  },
};

export const placeOfDeathQuestion: QuestionDefinition = {
  id: 'where-one-will-die-place-of-death',
  title: 'Where will they die?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
