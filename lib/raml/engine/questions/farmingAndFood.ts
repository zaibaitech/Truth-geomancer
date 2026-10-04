// Source: Kanzul Mikban, Chapter 27 — "About Farming and Food in the Year"
// (id "about-farming-and-food-in-the-year"). Two methods, both restored from
// the author-confirmed final edition's explicit figure lists
// (kanzulFinalEditionFigures.ts).
//
// METHOD-SPECIFIC SOURCE MAPPING (not a change to STARS): both methods
// classify the summed figure by the source's own named lists of East / West /
// North / South stars and fire / air / water / sand stars. Those lists put
// Usman with the West/air stars and Nuhu with the South/sand stars, which
// differs from content/stars.ts's own element field for those two figures.
// These methods follow the explicit source lists.
//
// Outcomes: Method 1 names the region that gets a bumper harvest (favourable
// for that region). Method 2's fire/air/water stars give a good harvest that
// something spoils (mixed); sand stars give a harvest with no calamity
// (favourable).

import { ADD_MULTIPLE_HOUSES, MATCH_FIGURE } from '../operations';
import {
  CH27_M1_EAST,
  CH27_M1_NORTH,
  CH27_M1_SOUTH,
  CH27_M1_WEST,
  CH27_M2_AIR,
  CH27_M2_FIRE,
  CH27_M2_SAND,
  CH27_M2_WATER,
  idsOf,
  type FigureList,
} from '../kanzulFinalEditionFigures';
import type { MethodDefinition, MethodOutcome, QuestionDefinition } from '../types';

const CHAPTER_ID = 'about-farming-and-food-in-the-year';

const inList = (list: FigureList, figureId: string) => idsOf(list).includes(figureId);

const method1: MethodDefinition = {
  id: 'farming-method-1',
  label: 'Method 1 (harvest by direction)',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, pick h1, h7, h4 and h8 and add them. If you get stars of the East Yussif, Adam, Kalla Allahu, Musah, it means they will get a bumper harvest in that year. If you get the stars of the West: Usman, Mahadi, Ali, Umar, West people will get a bumper harvest that year. If you get stars of the North Iddris, Ibrahim, Issah, Hassan & Hussein, people of the North will get a bumper harvest more than all in that year. If you get stars of the South: Nuhu, Yunus, Sulemana, Ayuba, people from the South will get a bumper harvest in that year.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7, 4, 8]);
    return { housesUsed: [1, 7, 4, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const id = calc.resultFigure.figureId;
    const name = calc.resultFigure.figureName;
    if (inList(CH27_M1_EAST, id)) return { outcome: 'favourable', label: `${name}: stars of the East`, interpretation: 'They will get a bumper harvest in that year.' };
    if (inList(CH27_M1_WEST, id)) return { outcome: 'favourable', label: `${name}: stars of the West`, interpretation: 'West people will get a bumper harvest that year.' };
    if (inList(CH27_M1_NORTH, id)) return { outcome: 'favourable', label: `${name}: stars of the North`, interpretation: 'People of the North will get a bumper harvest more than all in that year.' };
    if (inList(CH27_M1_SOUTH, id)) return { outcome: 'favourable', label: `${name}: stars of the South`, interpretation: 'People from the South will get a bumper harvest in that year.' };
    return { outcome: 'uncertain', label: name, interpretation: 'This figure is not in any of the four direction lists.' };
  },
};

const BRANCHES2: { list: FigureList; kind: string; outcome: MethodOutcome; text: string }[] = [
  {
    list: CH27_M2_FIRE,
    kind: 'fire stars',
    outcome: 'mixed',
    text: 'There will be good harvest, but locusts and grasshoppers are going to eat or spoil most of it. Write Suratul Falaq and Suratul Nass (7 times) each on paper and make it 5 layers. Bury them in the farm. Also write them the same number, wash them, and mix it with the things you are going to sow.',
  },
  {
    list: CH27_M2_AIR,
    kind: 'air stars',
    outcome: 'mixed',
    text: "You will get a bumper harvest but animals (beasts) will eat or spoil a lot of them that year. Write Suratul Naba'a (1 time) each on 5 papers and make them layers. Bury them in the farm. Also write it 5 times, wash it, and mix it with what you are going to sow.",
  },
  {
    list: CH27_M2_WATER,
    kind: 'water stars',
    outcome: 'mixed',
    text: "You will get a bumper harvest but worms or maggots will eat or spoil a lot of them. Write Ayatul Kursiyy (9 times) on each paper and make them 5 layers. Bury them in the farm. Also write it the same number, and mix it with what you are going to sow. It also means that year's rainfall will not be much, which will cause a low harvest — pray a lot for rainfall in that year.",
  },
  {
    list: CH27_M2_SAND,
    kind: 'sand/earth stars',
    outcome: 'favourable',
    text: "You will get a bumper harvest and nothing bad will happen that year — no calamity will befall your farms, insha'Allah.",
  },
];

const method2: MethodDefinition = {
  id: 'farming-method-2',
  label: 'Method 2 (general harvest/calamity)',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, pick h1, h5, h10 and h15 and add them. If you get fire stars: Yussif, Kalla Allahu, Adam, Musah, there will be good harvest, but locusts and grasshoppers are going to eat or spoil most of it. If you get air stars: Usman, Mahadi, Ali, Umar, you will get a bumper harvest but animals (beasts) will eat or spoil a lot of them that year. If you get water stars Iddris, Ibrahim, Hassan & Hussein, Issah, you will get a bumper harvest but worms or maggots will eat or spoil a lot of them. If you get sand/earth stars: Nuhu, Yunus, Sulemana, Ayuba, you will get a bumper harvest and nothing bad will happen that year — no calamity will befall your farms, insha\'Allah.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5, 10, 15]);
    return { housesUsed: [1, 5, 10, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const branch = BRANCHES2.find((b) => idsOf(b.list).some((id) => MATCH_FIGURE(calc.resultFigure, id)));
    return branch
      ? { outcome: branch.outcome, label: `${calc.resultFigure.figureName}: ${branch.kind}`, interpretation: branch.text }
      : { outcome: 'uncertain', label: calc.resultFigure.figureName, interpretation: 'This figure is not in any of the four element lists.' };
  },
};

export const farmingAndFoodQuestion: QuestionDefinition = {
  id: 'about-farming-and-food-in-the-year',
  title: 'How will farming and food be this year?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
