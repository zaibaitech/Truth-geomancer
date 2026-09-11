// Curated reading categories, each backed by real method(s) from Kanzul
// Mikban (content/manuscripts/kanzul-mikban.ts). The book itself covers over
// 150 narrowly-specific questions — far too many for a picker — so this is a
// deliberately smaller, practical set of everyday categories, each pointing
// at its closest real chapter(s). Extend this list as more chapters prove
// useful to surface directly, rather than exposing all 153 as raw choices.

export type IconName =
  | 'sparkles' | 'plane' | 'coins' | 'briefcase' | 'compass' | 'swords'
  | 'eye' | 'heart' | 'map-pin' | 'stethoscope' | 'key-round' | 'home'
  | 'gem' | 'baby' | 'activity' | 'trending-up' | 'shield' | 'clock'
  | 'crown' | 'flame' | 'users' | 'wheat' | 'door-open' | 'scale' | 'moon';

export interface Intention {
  id: string;
  label: string;
  description: string;
  icon: IconName;
  /** Kanzul Mikban chapter ids (content/manuscripts/kanzul-mikban.ts) this
   * intention surfaces after casting. Empty for the general/no-method option. */
  chapterIds: string[];
}

export const INTENTIONS: Intention[] = [
  {
    id: 'general',
    label: 'General Reading',
    description: 'No specific question — just cast and read the chart',
    icon: 'sparkles',
    chapterIds: [],
  },
  {
    id: 'travel',
    label: 'Travel & Journeys',
    description: 'Will you return safely, and with money?',
    icon: 'plane',
    chapterIds: ['traveling-business-and-if-you-will-return-from', 'if-you-will-be-successful-and-get-what', 'when-to-travel-daytime-or-night-time'],
  },
  {
    id: 'money-today',
    label: 'Money Today',
    description: 'Will you get money today or not',
    icon: 'coins',
    chapterIds: ['if-you-want-to-know-if-you-will'],
  },
  {
    id: 'business',
    label: 'Business, Profit & Loss',
    description: 'Will this venture or trade bring profit',
    icon: 'briefcase',
    chapterIds: ['business-profit-and-loss', 'if-it-s-business-or-handwork-that-will'],
  },
  {
    id: 'searching',
    label: 'Searching for Something',
    description: 'Hunting, searching land or water for anything',
    icon: 'compass',
    chapterIds: ['hunting-in-water-and-on-land-and-searching'],
  },
  {
    id: 'contest',
    label: 'Fight, Case, or War',
    description: 'Will you win a fight, court case, or conflict',
    icon: 'swords',
    chapterIds: ['if-you-will-win-a-fight-war-or', 'if-you-will-win-a-case-in-court', 'how-to-make-one-win-over-the-other'],
  },
  {
    id: 'enemy-thief',
    label: 'An Enemy or a Thief',
    description: 'Where they are hidden, and who they are',
    icon: 'eye',
    chapterIds: ['if-you-want-to-know-where-your-enemy', 'the-whereabouts-of-a-thief-or-robbers'],
  },
  {
    id: 'marriage',
    label: 'Marriage & Its Blessings',
    description: "Whether it's good, and if it will last",
    icon: 'heart',
    chapterIds: ['marriage-and-its-blessings', 'if-a-marriage-is-good-or-not', 'if-a-marriage-will-last-forever'],
  },
  {
    id: 'stay-or-go',
    label: 'Should I Stay Here?',
    description: 'A place, a house, or a town',
    icon: 'map-pin',
    chapterIds: ['if-one-will-stay-in-a-particular-place', 'if-it-s-good-to-stay-in-a-2'],
  },
  {
    id: 'sickness',
    label: 'Sickness & Recovery',
    description: 'Will the sick person survive, and why',
    icon: 'stethoscope',
    chapterIds: ['sickness-if-he-she-will-survive', 'if-the-querent-is-sick-or-not', 'if-the-sickness-is-from-human-jinn-or'],
  },
  {
    id: 'lost-stolen',
    label: 'Lost or Stolen Things',
    description: 'Is it still around, and will you get it back',
    icon: 'key-round',
    chapterIds: ['if-your-lost-thing-is-still-around-or', 'if-you-will-get-your-stolen-things-back', 'about-a-lost-thing-stolen-things'],
  },
  {
    id: 'success',
    label: 'Success at Home or Away',
    description: 'Where your effort will actually pay off',
    icon: 'home',
    chapterIds: ['if-you-want-to-know-if-you-will-2'],
  },
  {
    id: 'wealth',
    label: 'Wealth in Life',
    description: 'Will you be rich, and will it last',
    icon: 'gem',
    chapterIds: ['if-you-want-to-know-if-you-will-3', 'if-your-success-or-wealth-will-remain-forever'],
  },
  {
    id: 'children',
    label: 'Having Children',
    description: 'Will you get children, and a son or daughter',
    icon: 'baby',
    chapterIds: ['if-you-will-get-children-from-a-lady', 'if-a-lady-is-pregnant-or-not', 'if-it-s-a-male-or-female-child'],
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy Health & Timing',
    description: "How it's progressing, and when",
    icon: 'activity',
    chapterIds: ['if-a-pregnancy-is-going-to-be-stable', 'if-the-pregnancy-is-healthy-or-not', 'which-day-a-pregnant-woman-will-put-to'],
  },
  {
    id: 'improvement',
    label: 'Will Things Improve?',
    description: 'For you, this year or generally',
    icon: 'trending-up',
    chapterIds: ['if-things-will-be-better-for-the-questioner', 'if-things-are-going-to-be-well-this'],
  },
  {
    id: 'overcome-enemy',
    label: 'Overcoming an Enemy',
    description: 'Whether their efforts against you will succeed',
    icon: 'shield',
    chapterIds: ['if-you-will-overcome-your-enemy-or-not', 'if-your-enemies-are-working-against-you-or'],
  },
  {
    id: 'timing',
    label: 'When Will It Happen?',
    description: 'Hour, day, week, month, or year',
    icon: 'clock',
    chapterIds: ['if-something-will-happen-in-an-hour-day'],
  },
  {
    id: 'election',
    label: 'Elections & Leadership',
    description: 'Who will win an election or a title',
    icon: 'crown',
    chapterIds: ['who-will-win-an-election-or-a-chieftaincy'],
  },
  {
    id: 'love',
    label: 'Love, Attraction & Feelings',
    description: 'Do they love you, or feel something for you',
    icon: 'flame',
    chapterIds: ['if-someone-loves-you-much-less-or-not', 'if-she-he-loves-you-or-not', 'if-a-lady-or-man-has-feelings-for'],
  },
  {
    id: 'friendship',
    label: 'Friendship',
    description: 'Is it good, and where is it heading',
    icon: 'users',
    chapterIds: ['the-friendship-between-two-people-if-it-s', 'how-the-future-of-two-people-s-friendship'],
  },
  {
    id: 'farming',
    label: 'Farming & the Year’s Food',
    description: 'What the season holds',
    icon: 'wheat',
    chapterIds: ['about-farming-and-food-in-the-year'],
  },
  {
    id: 'visitor',
    label: 'A Visitor or Stranger',
    description: 'Is the person coming to you good or bad',
    icon: 'door-open',
    chapterIds: ['if-your-visitor-or-the-person-that-comes'],
  },
  {
    id: 'legal',
    label: 'Court, Prison & Legal Trouble',
    description: 'Case outcomes, and time spent inside',
    icon: 'scale',
    chapterIds: ['if-you-will-win-a-case-in-court', 'if-a-prisoner-will-come-out-of-prison', 'how-long-the-prisoner-will-stay-in-prison'],
  },
  {
    id: 'dreams',
    label: 'Dreams',
    description: 'What a dream you had might mean',
    icon: 'moon',
    chapterIds: ['dreams-and-their-interpretations'],
  },
];

export function getIntentionById(id: string): Intention | undefined {
  return INTENTIONS.find((i) => i.id === id);
}
