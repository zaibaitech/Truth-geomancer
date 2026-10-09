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
  { number: 5, name: 'Children', about: 'Children, pleasure, new undertakings' },
  { number: 6, name: 'Health & Rivals', about: 'Wellbeing, rivals, daily work' },
  { number: 7, name: 'Marriage', about: 'Marriage, partnership, contracts' },
  { number: 8, name: 'Transformation', about: 'Endings, inheritance, deep change' },
  { number: 9, name: 'Religion & Travel', about: 'Faith, long journeys, learning' },
  { number: 10, name: 'Career', about: 'Work, status, public standing' },
  { number: 11, name: 'Hopes', about: 'Friends, hopes, support' },
  { number: 12, name: 'Hidden Matters', about: 'Constraints, private sorrows' },
  { number: 13, name: 'Right Witness', about: 'How the matter is moving' },
  { number: 14, name: 'Left Witness', about: 'What supports or opposes it' },
  { number: 15, name: 'The Judge', about: 'The chart’s overall answer' },
  { number: 16, name: 'The Reconciler', about: 'The context behind the Judge' },
];
