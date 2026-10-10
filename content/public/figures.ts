// The 16 figures: PUBLIC fields only (SEO Phase 1, Stage 1c).
//
// name, number (Bazdaaho order, 1 Yussif to 16 Musah), dot pattern (top row
// first; 1 = one dot, 2 = two dots) and the element given in The Master of
// Geomancy. These four fields are already free in the app (every cast chart
// and /search show them; see 'figure-basics' in
// tests/fixtures/publicContentAllowlist.ts).
//
// This is a COPY, not an import, on purpose: content/stars.ts also holds
// paid material (house meanings, remedies, sadaqah), and public pages must
// not import it at all. tests/guards/seoPages.test.tsx checks that this copy
// matches content/stars.ts field for field, so the two cannot drift.
//
// No other-language names (Latin, Arabic, French, Hausa) and no fortune or
// meaning are published here.
export type FigureDotRow = 1 | 2;
export type FigurePattern = [FigureDotRow, FigureDotRow, FigureDotRow, FigureDotRow];
export type FigureElement = 'fire' | 'air' | 'water' | 'sand';

export interface PublicFigure {
  id: string;
  number: number;
  name: string;
  pattern: FigurePattern;
  element: FigureElement;
}

export const PUBLIC_FIGURES: PublicFigure[] = [
  { id: 'yussif', number: 1, name: 'Yussif', pattern: [1, 1, 2, 1], element: 'fire' },
  { id: 'adam', number: 2, name: 'Adam', pattern: [1, 2, 2, 2], element: 'fire' },
  { id: 'mahadi', number: 3, name: 'Mahadi', pattern: [2, 1, 1, 1], element: 'air' },
  { id: 'iddris', number: 4, name: 'Iddris', pattern: [2, 2, 1, 2], element: 'water' },
  { id: 'ibrahim', number: 5, name: 'Ibrahim', pattern: [1, 1, 1, 1], element: 'water' },
  { id: 'issah', number: 6, name: 'Issah', pattern: [1, 2, 1, 2], element: 'water' },
  { id: 'umar', number: 7, name: 'Umar', pattern: [2, 1, 2, 2], element: 'air' },
  { id: 'ayuba', number: 8, name: 'Ayuba', pattern: [2, 2, 2, 1], element: 'sand' },
  { id: 'kalla-allahu', number: 9, name: 'Kalla Allahu', pattern: [1, 1, 2, 2], element: 'fire' },
  { id: 'sulemana', number: 10, name: 'Sulemana', pattern: [1, 2, 2, 1], element: 'sand' },
  { id: 'ali', number: 11, name: 'Ali', pattern: [2, 1, 1, 2], element: 'air' },
  { id: 'nuhu', number: 12, name: 'Nuhu', pattern: [2, 2, 1, 1], element: 'air' },
  { id: 'hassan-hussein', number: 13, name: 'Hassan & Hussein', pattern: [1, 1, 1, 2], element: 'water' },
  { id: 'yunus', number: 14, name: 'Yunus', pattern: [1, 2, 1, 1], element: 'sand' },
  { id: 'usman', number: 15, name: 'Usman', pattern: [2, 1, 2, 1], element: 'sand' },
  { id: 'musah', number: 16, name: 'Musah', pattern: [2, 2, 2, 2], element: 'fire' },
];

/** Element names as the app shows them (same as ELEMENT_LABEL in content/stars.ts). */
export const FIGURE_ELEMENT_LABEL: Record<FigureElement, string> = {
  fire: 'Fire',
  air: 'Air',
  water: 'Water',
  sand: 'Sand / Earth',
};

export function figurePath(id: string): string {
  return `/figures/${id}`;
}

export function getPublicFigure(id: string): PublicFigure | undefined {
  return PUBLIC_FIGURES.find((f) => f.id === id);
}
