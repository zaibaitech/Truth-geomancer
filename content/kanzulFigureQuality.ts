// KANZUL FIGURE-QUALITY CONTEXT — what "good", "middle-good" and "bad" mean for
// the sixteen figures when a Kanzul Mikban method asks for them.
//
// Kanzul Mikban uses these terms in about a hundred methods but, in the edition
// we hold, never says which figures are which. This module is a CONTEXTUAL
// classification, not Kanzul's own list, and it is deliberately separate from
// content/classicalAttributes.ts (the Western table the rest of the engine
// still uses). Nothing here feeds the universal engine: it is read only where a
// Kanzul method explicitly asks for figure quality, and only to explain or
// resolve that wording.
//
// Provenance:
//   - Kitāb maʿrifat ʿalāmat al-insān explicitly defines fortunate = good,
//     mixed = middle-good, ill-omened = bad and groups the sixteen figures
//     6 good / 6 middle / 4 bad. It is a different book from Kanzul Mikban; it
//     is used as context only and is not read here directly (the grouping was
//     supplied by the project owner).
//   - The author's recorded explanation agrees with it for Yussif (middle-good).
//
// Unresolved on purpose (no quality is assigned):
//   - Yunus: the author's recording is conflicting (some say middle-good, some
//     bad) while the Arabic source says middle.
//   - Sulemana: the author's recording says it is NOT middle, while the Arabic
//     source puts it in middle.
// For these the app must keep the method uncertain rather than guess.
//
// Pure and client-safe: no server imports.

export type KanzulQuality = 'good' | 'middle-good' | 'bad';
export type KanzulQualityStatus = 'contextual' | 'unresolved';
export type KanzulQualityConfidence = 'high' | 'medium' | 'none';

export interface KanzulFigureQualityEntry {
  /** Matches content/stars.ts Star.id. */
  figure: string;
  /** Null exactly when status is 'unresolved'. */
  quality: KanzulQuality | null;
  status: KanzulQualityStatus;
  confidence: KanzulQualityConfidence;
  /** Where the classification comes from — never "Kanzul Mikban". */
  provenance: string[];
}

const ARABIC_SOURCE = 'Kitāb maʿrifat ʿalāmat al-insān (contextual source; not Kanzul Mikban)';
const AUTHOR_RECORDING = "Author's recorded explanation";

const contextual = (figure: string, quality: KanzulQuality, extra: string[] = [], confidence: KanzulQualityConfidence = 'medium'): KanzulFigureQualityEntry => ({
  figure,
  quality,
  status: 'contextual',
  confidence,
  provenance: [ARABIC_SOURCE, ...extra],
});

const unresolved = (figure: string, why: string): KanzulFigureQualityEntry => ({
  figure,
  quality: null,
  status: 'unresolved',
  confidence: 'none',
  provenance: [why],
});

export const KANZUL_FIGURE_QUALITY: Readonly<Record<string, KanzulFigureQualityEntry>> = {
  nuhu: contextual('nuhu', 'good'),
  iddris: contextual('iddris', 'good'),
  mahadi: contextual('mahadi', 'good'),
  usman: contextual('usman', 'good'),
  'kalla-allahu': contextual('kalla-allahu', 'good'),
  adam: contextual('adam', 'good'),
  ibrahim: contextual('ibrahim', 'middle-good'),
  ali: contextual('ali', 'middle-good'),
  musah: contextual('musah', 'middle-good'),
  yussif: contextual('yussif', 'middle-good', [AUTHOR_RECORDING], 'high'),
  'hassan-hussein': contextual('hassan-hussein', 'bad'),
  umar: contextual('umar', 'bad'),
  ayuba: contextual('ayuba', 'bad'),
  issah: contextual('issah', 'bad'),
  yunus: unresolved('yunus', "Sources conflict: the Arabic source says middle; the author's recording says some call it middle-good and some bad."),
  sulemana: unresolved('sulemana', "Sources conflict: the Arabic source says middle; the author's recording says it is not middle."),
};

export const KANZUL_QUALITY_LABEL: Record<KanzulQuality, string> = {
  good: 'Good',
  'middle-good': 'Middle-good',
  bad: 'Bad',
};

/** Shown wherever the app explains Kanzul's good/middle-good/bad wording. */
export const KANZUL_QUALITY_PROVENANCE_NOTE =
  'Contextual classification from Kitāb maʿrifat ʿalāmat al-insān; Kanzul Mikban does not explicitly define the 16 figure-quality groups.';

/** Text-parsed pipeline only: there the contextual layer itself decides the
 * result, so an unresolved figure really does leave the method uncertain. */
export const KANZUL_QUALITY_UNRESOLVED_NOTE =
  "This figure's quality is not settled by the available sources, so the method stays uncertain rather than guessing.";

/** The contextual quality of a figure, or null when it is unresolved or unknown. */
export function kanzulQualityOf(figureId: string): KanzulQuality | null {
  return KANZUL_FIGURE_QUALITY[figureId]?.quality ?? null;
}

export function isKanzulQualityUnresolved(figureId: string): boolean {
  return KANZUL_FIGURE_QUALITY[figureId]?.status === 'unresolved';
}

/** What a UI needs to show "Figure quality: …" honestly for one figure. It
 * keeps two things apart: the CONTEXTUAL quality (this layer) and the quality
 * the existing ENGINE actually used for the calculation. */
export interface FigureQualityContext {
  /** The contextual quality, or 'unresolved' (never a guessed value). */
  quality: KanzulQuality | 'unresolved';
  /** The quality the existing engine calculated this result with (the global
   * table). Null when the contextual layer itself decided the result (the
   * text-parsed pipeline), i.e. there is no separate engine classification. */
  engineQuality: KanzulQuality | null;
  /** False when the engine used a quality that differs from, or is not
   * confirmed by, the contextual one. */
  engineAgrees: boolean;
}

const ENGINE_TO_KANZUL: Record<string, KanzulQuality> = { good: 'good', middleGood: 'middle-good', bad: 'bad' };

/** Engine rows: pass the figure and the fortune the engine used. */
export function figureQualityContext(figureId: string, engineFortune: string | null = null): FigureQualityContext {
  const quality = kanzulQualityOf(figureId) ?? 'unresolved';
  const engineQuality = engineFortune === null ? null : (ENGINE_TO_KANZUL[engineFortune] ?? null);
  const engineAgrees = engineQuality === null || (quality !== 'unresolved' && engineQuality === quality);
  return { quality, engineQuality, engineAgrees };
}

/** Text-parsed verdicts: the contextual layer decided the result. */
export function contextualOnlyQuality(quality: KanzulQuality | 'unresolved'): FigureQualityContext {
  return { quality, engineQuality: null, engineAgrees: true };
}

export function figureQualityText(context: Pick<FigureQualityContext, 'quality'>): string {
  return context.quality === 'unresolved' ? 'Figure quality: Not classified' : `Figure quality: ${KANZUL_QUALITY_LABEL[context.quality]}`;
}

/** The explanatory lines under "Figure quality: …". Wording depends on who
 * decided the result — never claims an engine result is "uncertain". */
export function figureQualityNotes(context: FigureQualityContext): string[] {
  const { quality, engineQuality } = context;
  if (engineQuality == null) {
    return quality === 'unresolved' ? [KANZUL_QUALITY_UNRESOLVED_NOTE] : [];
  }
  const used = `This result was calculated with the app's existing figure table, which classifies this figure as ${KANZUL_QUALITY_LABEL[engineQuality]}.`;
  if (quality === 'unresolved') return [`${used} That classification is not confirmed by the available sources.`];
  return engineQuality === quality ? [] : [used];
}
