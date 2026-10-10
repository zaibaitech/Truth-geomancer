// Free-cast Phase B: the short, newly written teaching copy shown with a free
// sample reading, plus the registry of "Keep learning" links.
//
// Everything here is original wording for the geomantic addition rule that the
// app already applies (lib/raml/casting.ts: matching rows give two dots,
// differing rows give one). It states no figure or house meanings, no
// history and no religious claims, and it does not reproduce any passage,
// diagram or example from the paid manuscript. No imports on purpose: the
// copy can be audited, and tested against a vocabulary allowlist, in isolation.

export const LEARN_COPY = {
  stepsIntro: 'These are the houses this method used, and how they combine.',
  figureLine: 'A figure has four rows. Each row is either one dot or two dots.',
  ruleHeading: 'Adding two figures',
  rule: 'Compare the two figures one row at a time. Where the rows match, the new row has two dots. Where they differ, the new row has one dot.',
  exampleCaption: 'A made-up example, not from your reading.',
  practiceHeading: 'Try it yourself',
  practiceIntro:
    'Now try it with the houses from your own reading. Work through the houses in the order listed. Add the first two, then add that result to the next, and so on.',
  rowLegend: (row: number) => `Row ${row}`,
  oneDot: 'One dot',
  twoDots: 'Two dots',
  check: 'Check my answer',
  tryAgain: 'Try again',
  showAnswer: 'Show the answer',
  incomplete: 'Choose one dot or two dots for every row, then check your answer.',
  correct: 'That matches the result above.',
  incorrect: 'Not quite. Check which rows match and which differ, then try again or show the answer.',
  revealed: "The method's result is shown below, with its working.",
  linksHeading: 'Keep learning',
} as const;

export type DotCount = 1 | 2;
export type FourRows = [DotCount, DotCount, DotCount, DotCount];

/** The worked demonstration. Made up; it is not connected to any reading and is
 * checked against the app's own addPatterns in the tests. */
export const WORKED_EXAMPLE: { a: FourRows; b: FourRows; result: FourRows } = {
  a: [1, 2, 1, 2],
  b: [1, 1, 2, 2],
  result: [2, 1, 1, 2],
};

export interface LearnLink {
  label: string;
  href: string;
  /** The page file that must exist for the link to be shown. */
  pageFile: string;
  /** True only when `pageFile` exists in this build. A test keeps the two in step. */
  enabled: boolean;
}

/** Shown only when `enabled`. The destination pages belong to the separate SEO
 * work and are not assumed to be live; all stay hidden until their page file
 * exists (enforced by lib/raml/freeCastLearning.test.ts). */
export const LEARN_LINKS: readonly LearnLink[] = [
  { label: 'How geomancy works', href: '/learn/ilm-al-raml', pageFile: 'app/learn/ilm-al-raml/page.tsx', enabled: true },
  { label: 'The sixteen figures', href: '/figures', pageFile: 'app/figures/page.tsx', enabled: true },
  { label: 'The sixteen houses', href: '/houses', pageFile: 'app/houses/page.tsx', enabled: true },
  { label: 'Glossary', href: '/learn/glossary', pageFile: 'app/learn/glossary/page.tsx', enabled: true },
];
