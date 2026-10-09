import { FIGURE_ELEMENT_LABEL, PUBLIC_FIGURES, getPublicFigure, type PublicFigure } from '@/content/public/figures';

// Individual figure pages (SEO Phase 1, Stage 1d). Only these four are
// published for now; every other slug is a 404 and is not in the sitemap.
// Each page shows only the free basics (name, number, pattern, element) plus
// short approved copy, and points to the free cast and the books for the
// meanings. No meanings, fortunes, remedies or other-language names.
export const FIGURE_PAGE_SLUGS = ['ibrahim', 'musah', 'nuhu', 'usman'] as const;

/** Short element name used in page titles ("Usman: Geomancy Figure 15 (Sand)"). */
const TITLE_ELEMENT: Record<PublicFigure['element'], string> = { fire: 'Fire', air: 'Air', water: 'Water', sand: 'Sand' };

export function figurePageTitle(f: PublicFigure): string {
  return `${f.name}: Geomancy Figure ${f.number} (${TITLE_ELEMENT[f.element]})`;
}

export function figurePageDescription(f: PublicFigure): string {
  return `${f.name} is figure ${f.number} of the 16 in Ilm al-Raml. See its dot pattern and element, and discover what it means in your chart.`;
}

/** "It comes after Iddris and before Issah." / "It is the last figure, coming after Usman." */
export function figurePlacement(f: PublicFigure): string {
  const prev = PUBLIC_FIGURES.find((x) => x.number === f.number - 1);
  const next = PUBLIC_FIGURES.find((x) => x.number === f.number + 1);
  if (!next) return `It is the last figure, coming after ${prev!.name}.`;
  if (!prev) return `It is the first figure, coming before ${next.name}.`;
  return `It comes after ${prev.name} and before ${next.name}.`;
}

/** "one dot; one dot; two dots; one dot" (top to bottom). */
export function figurePatternWords(f: PublicFigure): string {
  return f.pattern.map((n) => (n === 1 ? 'one dot' : 'two dots')).join('; ');
}

/** The other figures with the same element, in book order. */
export function figuresSharingElement(f: PublicFigure): PublicFigure[] {
  return PUBLIC_FIGURES.filter((x) => x.element === f.element && x.id !== f.id);
}

export function elementLabel(f: PublicFigure): string {
  return FIGURE_ELEMENT_LABEL[f.element];
}

export function getFigurePage(slug: string): PublicFigure | undefined {
  return (FIGURE_PAGE_SLUGS as readonly string[]).includes(slug) ? getPublicFigure(slug) : undefined;
}
