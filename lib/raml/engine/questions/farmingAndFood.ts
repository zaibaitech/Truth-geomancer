// Source: Kanzul Mikban, Chapter 27 — "About Farming and Food in the Year"
// (id "about-farming-and-food-in-the-year"). Both methods' every branch
// depends on named "stars of the East/West/North/South" or named
// fire/air/water/sand figures the source transcription omitted — nothing
// here is computable. Registered anyway, per project convention.

import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'about-farming-and-food-in-the-year';

const method1: MethodDefinition = {
  id: 'farming-method-1',
  label: 'Method 1 (harvest by direction)',
  status: 'uncertain',
  reviewNote:
    'Every branch (stars of the East/West/North/South) depends on named figures the source transcription omitted. Nothing here is computable.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1, h7, h4 and h8 and add them. If you get stars of the East [figures omitted — symbols not preserved in this transcription] it means they will get a bumper harvest in that year.",
  },
  calculate: () => {
    throw new Error('Every branch of this method depends on named figures the source transcription omitted.');
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
};

const method2: MethodDefinition = {
  id: 'farming-method-2',
  label: 'Method 2 (general harvest/calamity)',
  status: 'uncertain',
  reviewNote:
    'Every branch (fire/air/water/sand "stars") depends on named figures the source transcription omitted. Nothing here is computable.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1, h5, h10 and h15 and add them. If you get fire stars: [figures omitted — symbols not preserved in this transcription] there will be good harvest, but locusts and grasshoppers are going to eat or spoil most of it.",
  },
  calculate: () => {
    throw new Error('Every branch of this method depends on named figures the source transcription omitted.');
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
};

export const farmingAndFoodQuestion: QuestionDefinition = {
  id: 'about-farming-and-food-in-the-year',
  title: 'How will farming and food be this year?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
