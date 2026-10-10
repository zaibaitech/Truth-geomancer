// The 16 houses of a chart: name and a short "about" line (SEO Phase 1,
// Stage 1c), as approved in the short houses draft. Condensed from
// lib/raml/houses.ts (already free in the app), with houses 6, 8 and 12
// worded neutrally for public pages. No house-by-house meanings of figures.
export interface PublicHouse {
  number: number;
  name: string;
  about: string;
}

export const PUBLIC_HOUSES: PublicHouse[] = [
  { number: 1, name: 'Self', about: 'The person asking' },
  { number: 2, name: 'Wealth', about: 'Money and possessions' },
  { number: 3, name: 'Siblings', about: 'Relatives, short journeys, news' },
  { number: 4, name: 'Home', about: 'Home, parents, land' },
  { number: 5, name: 'Children', about: 'Children, pleasure, creative undertakings' },
  { number: 6, name: 'Health & Opposition', about: 'Wellbeing, hidden opposition, daily work' },
  { number: 7, name: 'Marriage', about: 'Marriage, partnership, contracts' },
  { number: 8, name: 'Transformation', about: 'Endings, inheritance, deep change' },
  { number: 9, name: 'Religion & Travel', about: 'Faith, long journeys, learning' },
  { number: 10, name: 'Career', about: 'Work, status, public standing' },
  { number: 11, name: 'Hopes', about: 'Friends, hopes, support' },
  { number: 12, name: 'Hidden Matters', about: 'Constraints, private sorrows' },
  { number: 13, name: 'Right Witness', about: 'How the matter is moving' },
  { number: 14, name: 'Left Witness', about: 'What supports or opposes it' },
  { number: 15, name: 'The Judge', about: 'The chart’s final answer' },
  { number: 16, name: 'The Reconciler', about: 'The context behind the Judge' },
];

/** The six named groups of houses, as the app's own chart view lists them (Houses 1-4 the Mothers,
 * 5-8 the Daughters, 9-12 the Nieces, 13-14 the Witnesses, 15 the Judge, 16 the Reconciler). The notes use
 * only what the free learning pages already say; no per-figure or per-house interpretation. */
export interface HouseGroup {
  name: string;
  /** Inclusive first and last house numbers. */
  from: number;
  to: number;
  range: string;
  note: string;
}

export const HOUSE_GROUPS: HouseGroup[] = [
  { name: 'The Mothers', from: 1, to: 4, range: 'Houses 1–4', note: 'The first four figures cast. The rest of the chart is built from them.' },
  { name: 'The Daughters', from: 5, to: 8, range: 'Houses 5–8', note: 'Filled in step by step from the Mothers.' },
  { name: 'The Nieces', from: 9, to: 12, range: 'Houses 9–12', note: 'Filled in step by step as the chart is built.' },
  { name: 'The Witnesses', from: 13, to: 14, range: 'Houses 13–14', note: 'The Right and Left Witness, which show how the matter is moving and what supports or opposes it.' },
  { name: 'The Judge', from: 15, to: 15, range: 'House 15', note: 'Gives the chart’s final answer.' },
  { name: 'The Reconciler', from: 16, to: 16, range: 'House 16', note: 'The context behind the Judge’s answer.' },
];
