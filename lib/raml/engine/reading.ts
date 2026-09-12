// LAYER 3 — reading composition (Prompt 3: "Advanced Geomantic Reading &
// Results Layer"). Takes an already-computed EngineResult (Layers 1+2,
// completely untouched by this file) plus the QuestionDefinition it came
// from, and re-arranges that SAME data into the shape a results screen
// needs: grouped figure indicators, per-method check/cross rows, one-line
// source references, and the exact copy required for the fully/partially
// unverified states.
//
// Nothing in this file recalculates anything, averages contradictory
// results, or invents an outcome that isn't already present on some
// method's own verdict. Every field here is either copied straight from
// EngineResult or is a pure re-formatting of counts EngineResult already
// computed (COMPARE_RESULTS in operations.ts remains the only place
// consensus is decided).

import { CATEGORIES } from '@/content/intentions';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import type { Element, Pattern } from '@/content/stars';
import type {
  ComputedFigure,
  EngineResult,
  MethodConsensus,
  MethodOutcome,
  QuestionDefinition,
  RuleStatus,
  SourceRef,
} from './types';

// ---------------------------------------------------------------------------
// Shared display vocabulary
// ---------------------------------------------------------------------------

export const OUTCOME_LABEL: Record<MethodOutcome | 'insufficient_data', string> = {
  favourable: 'Favourable',
  unfavourable: 'Unfavourable',
  mixed: 'Mixed',
  uncertain: 'Uncertain',
  insufficient_data: 'Insufficient Verified Data',
};

export const CONSENSUS_LABEL: Record<MethodConsensus['level'], string> = {
  agree: 'Methods agree',
  mostly_agree: 'Methods mostly agree',
  mixed: 'Mixed indications',
  conflict: 'Methods conflict',
  insufficient_data: 'Not enough computable methods',
};

const FORTUNE_LABEL: Record<'good' | 'middleGood' | 'bad', string> = {
  good: 'Good',
  middleGood: 'Middle Good',
  bad: 'Bad',
};

const DIRECTION_LABEL: Record<'upward' | 'downward', string> = {
  upward: 'Upward',
  downward: 'Downward',
};

const ELEMENT_LABEL: Record<Element, string> = {
  fire: 'Fire',
  air: 'Air',
  water: 'Water',
  sand: 'Sand',
};

const BOOK_LABEL: Record<SourceRef['book'], string> = {
  'kanzul-mikban': 'Kanzul Mikban',
  'master-of-geomancy-vol-1': 'Master of Geomancy, Vol. 1',
};

// ---------------------------------------------------------------------------
// ReadingResult shape
// ---------------------------------------------------------------------------

export interface ReadingIndicator {
  role: 'primary' | 'supporting';
  figureId: string;
  figureName: string;
  dotPattern: Pattern;
  element: string;
  /** Only ever set when the underlying quality's status is 'verified' —
   * never displayed as a guess (section 6). */
  fortune: string | null;
  direction: string | null;
  methodLabel: string;
  housesUsed: number[];
}

export interface ReadingMethodRow {
  id: string;
  label: string;
  status: RuleStatus;
  /** True only for a method whose own verdict.outcome was actually tallied
   * into the consensus (COMPARE_RESULTS excludes needs_review/uncertain
   * methods AND any verified method whose own outcome is 'uncertain' — e.g.
   * a chart falling outside every branch a rule defines). The Method
   * Consistency section should only ever show counted methods; everything
   * else belongs in Calculation Details instead. */
  counted: boolean;
  /** True/false only when `counted`; null otherwise — never gets a check
   * or cross mark since it was never part of the tally. */
  agreesWithOverall: boolean | null;
  outcome: MethodOutcome | null;
  outcomeLabel: string | null;
  interpretation: string | null;
  reviewNote: string | null;
  housesUsed: number[];
  calculationSteps: string[];
  resultFigureName: string | null;
  resultPattern: Pattern | null;
  sourceQuote: string;
  sourceLabel: string;
}

export interface SourceReference {
  book: string;
  chapterId: string;
  chapterNumber: number | null;
  label: string; // e.g. "Kanzul Mikban, Chapter 2"
}

export type SourceStatus = 'all_verified' | 'partially_verified' | 'none_verified';

export interface ReadingResult {
  questionId: string;
  question: string;
  questionCategory: string | null;
  overallOutcome: MethodOutcome | 'insufficient_data';
  outcomeLabel: string;
  shortSummary: string;
  detailedInterpretation: string;
  primaryFigure: ReadingIndicator | null;
  supportingIndicators: ReadingIndicator[];
  methodResults: ReadingMethodRow[];
  consensusLabel: string;
  /** A plain-language note built only from the already-computed counts,
   * e.g. "2 favourable, 1 unfavourable." Never a new statistic. */
  consensusBreakdown: string | null;
  /** Present only when the methods don't unanimously agree — states which
   * method(s) differ, without trying to resolve the disagreement. */
  disagreementNote: string | null;
  conflictingIndicators: boolean;
  relevantHouses: number[];
  sourceReferences: SourceReference[];
  sourceStatus: SourceStatus;
  /** The exact section-10 copy for a partially-verified result. Null when
   * every method is verified, and null (not shown) when isInsufficient is
   * true — that state uses its own dedicated copy instead. */
  verificationNotice: string | null;
  isInsufficient: boolean;
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

function sourceLabelFor(source: SourceRef): string {
  const book = BOOK_LABEL[source.book];
  if (source.book === 'kanzul-mikban') {
    const chapter = KM_CHAPTERS.find((c) => c.id === source.chapterId);
    if (chapter?.number != null) return `${book}, Chapter ${chapter.number}`;
  }
  return book;
}

function buildIndicator(role: 'primary' | 'supporting', figure: ComputedFigure, methodLabel: string): ReadingIndicator {
  const fortune = figure.qualities.fortune;
  const direction = figure.qualities.direction;
  return {
    role,
    figureId: figure.figureId,
    figureName: figure.figureName,
    dotPattern: figure.dotPattern,
    element: ELEMENT_LABEL[figure.element],
    fortune: fortune.status === 'verified' && fortune.value ? FORTUNE_LABEL[fortune.value] : null,
    direction: direction.status === 'verified' && direction.value ? DIRECTION_LABEL[direction.value] : null,
    methodLabel,
    housesUsed: figure.sourceHouses,
  };
}

function buildConsensusBreakdown(consensus: MethodConsensus): string | null {
  const parts: string[] = [];
  if (consensus.favourableCount > 0) parts.push(`${consensus.favourableCount} favourable`);
  if (consensus.unfavourableCount > 0) parts.push(`${consensus.unfavourableCount} unfavourable`);
  if (consensus.mixedCount > 0) parts.push(`${consensus.mixedCount} mixed`);
  return parts.length > 0 ? parts.join(', ') : null;
}

function buildDisagreementNote(consensus: MethodConsensus): string | null {
  if (consensus.level === 'agree' || consensus.level === 'insufficient_data') return null;
  const dominant = Math.max(consensus.favourableCount, consensus.unfavourableCount, consensus.mixedCount);
  const minority = consensus.verifiableCount - dominant;
  if (consensus.level === 'conflict') {
    return 'The traditional methods for this question genuinely disagree — this is preserved as-is, not resolved into a single answer.';
  }
  if (minority === 1) return 'One method gives a different indication.';
  if (minority > 1) return `${minority} methods give a different indication.`;
  return null;
}

export function composeReading(result: EngineResult, question: QuestionDefinition): ReadingResult {
  const consensus = result.calculationDetails.consensus;
  const category = CATEGORIES.find((c) => c.id === question.categoryId)?.label ?? null;

  const primaryMethodId = result.primaryFigure?.method.id ?? null;
  const primaryFigure = result.primaryFigure?.calculation
    ? buildIndicator('primary', result.primaryFigure.calculation.resultFigure, result.primaryFigure.method.label)
    : null;

  const seenFigureIds = new Set(primaryFigure ? [primaryFigure.figureId] : []);
  const supportingIndicators: ReadingIndicator[] = [];
  result.methods.forEach((m) => {
    if (m.method.id === primaryMethodId || !m.calculation) return;
    const figureId = m.calculation.resultFigure.figureId;
    if (seenFigureIds.has(figureId)) return;
    seenFigureIds.add(figureId);
    supportingIndicators.push(buildIndicator('supporting', m.calculation.resultFigure, m.method.label));
  });

  const methodResults: ReadingMethodRow[] = result.methods.map((m) => {
    const counted = m.verdict !== null && m.verdict.outcome !== 'uncertain';
    const agreesWithOverall = counted && result.overallResult !== 'insufficient_data' ? m.verdict!.outcome === result.overallResult : null;
    return {
      id: m.method.id,
      label: m.method.label,
      status: m.method.status,
      counted,
      agreesWithOverall,
      outcome: m.verdict?.outcome ?? null,
      outcomeLabel: m.verdict ? OUTCOME_LABEL[m.verdict.outcome] : null,
      interpretation: m.verdict?.interpretation ?? null,
      reviewNote: m.method.reviewNote ?? null,
      housesUsed: m.calculation?.housesUsed ?? [],
      calculationSteps: m.calculation?.steps ?? [],
      resultFigureName: m.calculation?.resultFigure.figureName ?? null,
      resultPattern: m.calculation?.resultFigure.dotPattern ?? null,
      sourceQuote: m.method.source.quote,
      sourceLabel: sourceLabelFor(m.method.source),
    };
  });

  const sourceReferences: SourceReference[] = [];
  const seenSource = new Set<string>();
  result.methods.forEach((m) => {
    const key = `${m.method.source.book}::${m.method.source.chapterId}`;
    if (seenSource.has(key)) return;
    seenSource.add(key);
    const chapter = m.method.source.book === 'kanzul-mikban' ? KM_CHAPTERS.find((c) => c.id === m.method.source.chapterId) : undefined;
    sourceReferences.push({
      book: BOOK_LABEL[m.method.source.book],
      chapterId: m.method.source.chapterId,
      chapterNumber: chapter?.number ?? null,
      label: sourceLabelFor(m.method.source),
    });
  });

  const isInsufficient = result.overallResult === 'insufficient_data';
  const hasUnverified = result.methods.some((m) => m.method.status !== 'verified');
  const sourceStatus: SourceStatus = isInsufficient ? 'none_verified' : hasUnverified ? 'partially_verified' : 'all_verified';

  return {
    questionId: result.questionId,
    question: result.question,
    questionCategory: category,
    overallOutcome: result.overallResult,
    outcomeLabel: OUTCOME_LABEL[result.overallResult],
    shortSummary: isInsufficient
      ? 'We could not produce a reliable automatic reading from the currently verified source rules.'
      : result.summary,
    detailedInterpretation: result.interpretation,
    primaryFigure,
    supportingIndicators,
    methodResults,
    consensusLabel: CONSENSUS_LABEL[consensus.level],
    consensusBreakdown: buildConsensusBreakdown(consensus),
    disagreementNote: buildDisagreementNote(consensus),
    conflictingIndicators: consensus.level === 'conflict',
    relevantHouses: result.supportingHouses,
    sourceReferences,
    sourceStatus,
    verificationNotice:
      sourceStatus === 'partially_verified'
        ? 'Some additional traditional methods could not be evaluated because their source material requires verification.'
        : null,
    isInsufficient,
  };
}
