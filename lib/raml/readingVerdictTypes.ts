// Client-safe result type for the "Your Reading" tab (Prompt 27B). This is
// a strict structural subset of lib/server/raml/methodVerdicts.ts's
// MethodVerdictResult, with `methodText` (the full protected method
// paragraph — never rendered by MethodVerdictCard, see its source) left
// out. Keeping it in this small type-only file (no runtime code, nothing
// from lib/server/) means the client components that reference this shape
// never need to import anything server-only.
import type { CombinedFigure } from './classicalVerdict';

export interface PublicMethodVerdict {
  label: string;
  housesUsed: number[];
  calculationSteps: string[];
  result: CombinedFigure;
  interpretation: string;
  ambiguous: boolean;
}

/** Keyed by chapter id, index-aligned with that chapter's paragraphs —
 * null entries mean "no computed verdict for this paragraph", and a null
 * value for a chapter key (rather than an array) means the chapter had no
 * automatically parseable method at all. Mirrors getMethodVerdicts'
 * return contract exactly (see lib/server/raml/methodVerdicts.ts). */
export type ReadingVerdictsByChapter = Record<string, (PublicMethodVerdict | null)[] | null>;
