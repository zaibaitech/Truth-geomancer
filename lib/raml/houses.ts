// The 16 chart positions. Houses 1-12 double as the classical astrological
// houses (the framework "The Master of Geomancy" itself uses, e.g. h2 = wealth,
// h6 = sickness/enemies). 13-16 are the interpretive figures built on top.

export type HouseRole = 'mother' | 'daughter' | 'niece' | 'witness' | 'judge' | 'reconciler';

export interface HouseInfo {
  n: number;
  role: HouseRole;
  title: string;
  meaning: string;
}

export const HOUSES: HouseInfo[] = [
  { n: 1, role: 'mother', title: 'Self', meaning: 'The querent — who is asking, and their present state.' },
  { n: 2, role: 'mother', title: 'Wealth', meaning: 'Money, possessions, financial movement.' },
  { n: 3, role: 'mother', title: 'Siblings', meaning: 'Siblings, close relatives, short journeys, news.' },
  { n: 4, role: 'mother', title: 'Home', meaning: 'Home, parents, land, the roots of the matter.' },
  { n: 5, role: 'daughter', title: 'Children', meaning: 'Children, pleasure, creative undertakings, pregnancy.' },
  { n: 6, role: 'daughter', title: 'Illness & Enemies', meaning: 'Sickness, hidden enemies, servants, daily labour.' },
  { n: 7, role: 'daughter', title: 'Marriage', meaning: 'Marriage, partnership, open rivals, contracts.' },
  { n: 8, role: 'daughter', title: 'Transformation', meaning: 'Death, inheritance, hidden danger, deep change.' },
  { n: 9, role: 'niece', title: 'Religion & Travel', meaning: 'Faith, long journeys, teachers, knowledge sought.' },
  { n: 10, role: 'niece', title: 'Career', meaning: 'Work, status, authority, public standing.' },
  { n: 11, role: 'niece', title: 'Hopes', meaning: 'Friends, hopes, support that arrives from others.' },
  { n: 12, role: 'niece', title: 'Hidden Enemies', meaning: 'Bondage, secret sorrow, concealed opposition.' },
  { n: 13, role: 'witness', title: 'Right Witness', meaning: 'How the matter is moving — drawn from Houses 1-4.' },
  { n: 14, role: 'witness', title: 'Left Witness', meaning: 'What opposes or supports the matter — drawn from Houses 5-8... 9-12.' },
  { n: 15, role: 'judge', title: 'The Judge', meaning: 'The verdict — the chart’s final, overriding answer.' },
  { n: 16, role: 'reconciler', title: 'The Reconciler', meaning: 'Underlying cause and root context for the Judge’s answer.' },
];

export function houseInfo(n: number): HouseInfo {
  const h = HOUSES.find((x) => x.n === n);
  if (!h) throw new Error(`No such house ${n}`);
  return h;
}
