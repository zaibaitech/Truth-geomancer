// LAYER 3 — reading composition (Prompt 3: "Advanced Geomantic Reading &
// Results Layer"; revised in Prompt 3.5 for semantic clarity). Takes an
// already-computed EngineResult (Layers 1+2, completely untouched by this
// file) plus the QuestionDefinition it came from, and re-arranges that SAME
// data into the shape a results screen needs.
//
// Nothing in this file recalculates anything, averages contradictory
// results, or invents an outcome that isn't already present on some
// method's own verdict. Every field here is either copied straight from
// EngineResult or is a pure re-formatting of counts EngineResult already
// computed (COMPARE_RESULTS in operations.ts remains the only place
// consensus is decided).
//
// Prompt 3.5's core fix: a figure's traditional QUALITIES (Good/Bad,
// Upward/Downward, element) are never the same thing as a METHOD's OUTCOME
// (favourable/unfavourable/mixed) for that figure. A "Bad" figure can still
// be the result of a "favourable" method — the calculation rule decides the
// outcome, not the quality label. Every indicator below carries both,
// clearly separated, plus the specific method's own interpretation and a
// short, honestly-derived note on how it relates to the overall reading.

import { CATEGORIES } from '@/content/intentions';
// Prompt 27 (protected-content migration): swapped from the full
// content/manuscripts/kanzul-mikban.ts (now server-only, relocated to
// lib/server/content/kanzulMikban.ts) to the public metadata-only
// export — this file only ever reads `.number` for a source label
// (sourceLabelFor below); it never touched chapter/paragraph text, so
// this is a same-shape import swap with zero effect on any calculation
// or reading composition.
import { KM_CHAPTER_META as KM_CHAPTERS } from '@/content/manuscripts/kanzulMikbanMeta';
import type { Element, Pattern } from '@/content/stars';
import { getEffectiveCastingRequirement, toPublicCastingMeta } from './castingRequirement';
import type {
  EngineResult,
  MethodConsensus,
  MethodOutcome,
  MethodResult,
  PublicCastingMeta,
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
  descriptive: 'Descriptive',
  insufficient_data: 'Insufficient Verified Data',
};

/** A method's outcome ('mixed' in particular) is never rendered with the
 * same visual weight as an unfavourable one — see MethodConsistencyCard. */
export const OUTCOME_ROW_LABEL: Record<MethodOutcome, string> = {
  favourable: 'Favourable',
  unfavourable: 'Unfavourable',
  mixed: 'Conditional / Mixed',
  uncertain: 'Uncertain',
  descriptive: 'Descriptive',
};

export const OUTCOME_TONE: Record<MethodOutcome | 'insufficient_data', 'sand' | 'fire' | 'neutral'> = {
  favourable: 'sand',
  unfavourable: 'fire',
  mixed: 'neutral',
  uncertain: 'neutral',
  descriptive: 'neutral',
  insufficient_data: 'neutral',
};

export const CONSENSUS_LABEL: Record<MethodConsensus['level'], string> = {
  agree: 'Methods agree',
  mostly_agree: 'Methods mostly agree',
  mixed: 'Mixed indications',
  conflict: 'Methods conflict',
  disagree: 'Methods disagree',
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

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// ReadingResult shape
// ---------------------------------------------------------------------------

export interface ReadingIndicator {
  role: 'primary' | 'supporting';
  figureId: string;
  figureName: string;
  dotPattern: Pattern;
  /** The figure's own traditional qualities — NEVER the method's outcome.
   * Only ever set when the underlying quality's status is 'verified'. */
  element: string;
  fortune: string | null;
  direction: string | null;
  methodLabel: string;
  methodStatus: RuleStatus;
  housesUsed: number[];
  /** THIS method's own outcome for this figure. Null when the method
   * produced no verdict at all (needs_review/uncertain status), which is
   * distinct from a verified method whose outcome is itself 'uncertain'
   * (falls outside every branch the rule defines) — that case still gets a
   * real outcome value here, just one COMPARE_RESULTS excludes from the
   * tally. Never to be read as agreeing with the figure's own quality. */
  methodOutcome: MethodOutcome | null;
  methodOutcomeLabel: string | null;
  interpretation: string | null;
  /** A short, honestly-derived note on how this indicator relates to the
   * overall reading — built only from the outcome comparison and the
   * method's own (already source-derived) interpretation text. Never a new
   * geomantic claim. */
  relevance: string | null;
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
  /** The result figure's own qualities — shown in Calculation Details for
   * advanced users, kept clearly separate from `outcome` above. */
  resultElement: string | null;
  resultFortune: string | null;
  resultDirection: string | null;
  sourceQuote: string;
  sourceLabel: string;
  /** Client-safe casting classification for this method (Prompt 74) — enums
   * and house numbers only, never notes or evidence (see PublicCastingMeta).
   * Always present: unclassified methods get the product default via
   * getEffectiveCastingRequirement, same as everywhere else this metadata is
   * read. Lets presentation components (e.g. the recast-working diagram)
   * branch on `casting.inspects === 'recast'` generically, without a
   * question-id or chapter check. */
  casting: PublicCastingMeta;
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
  /** 'descriptive' when this question's methods answer a categorical fact
   * (terrain, direction, location) rather than a favourable/unfavourable
   * verdict — drives which OutcomeCard variant and Method Consistency
   * wording is used. Never both at once. */
  resultKind: 'outcome' | 'descriptive';
  overallOutcome: MethodOutcome | 'insufficient_data';
  outcomeLabel: string;
  /** Only set when resultKind === 'descriptive' and the counted methods
   * agree: the shared categorical answer itself (e.g. "much water"), shown
   * in place of a favourable/unfavourable badge. Null on disagreement or
   * insufficient data — never a fabricated single answer. */
  descriptiveAnswer: string | null;
  /** The 1-2 sentence direct answer — traditional-consistency language only
   * (no invented probabilities/percentages/confidence scores). */
  shortSummary: string;
  /** The full, per-method concatenated interpretation text straight from
   * the engine — kept for advanced users inside Calculation Details, never
   * rendered as its own prominent block on the primary screen. */
  detailedInterpretation: string;
  primaryFigure: ReadingIndicator | null;
  supportingIndicators: ReadingIndicator[];
  methodResults: ReadingMethodRow[];
  consensusLabel: string;
  /** A full-sentence agreement summary built only from the existing
   * consensus counts, e.g. "Two methods indicate a favourable outcome. One
   * method gives a conditional indication." Never a bare "2 yes, 1 no". */
  consensusSentence: string | null;
  /** Present only for a genuine conflict (no dominant side at all) — states
   * that the methods disagree without trying to resolve it. */
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

/** Relates one indicator's own outcome to the overall reading — comparison
 * only, quoting the method's own existing interpretation text. Never
 * fabricates a new claim about what the figure means. */
function buildRelevance(
  outcome: MethodOutcome | null,
  overallOutcome: MethodOutcome | 'insufficient_data',
  interpretation: string | null,
): string | null {
  if (outcome === null) {
    return 'Not yet counted toward this result — see "How was this calculated?" for why.';
  }
  if (!interpretation) return null;
  if (outcome === 'uncertain') {
    return `Falls outside this rule's defined outcomes, so it isn't counted toward the result: ${interpretation}`;
  }
  // A descriptive answer doesn't "support" or "differ from" anything the
  // way a favourable/unfavourable one does — the answer itself, already
  // shown on the card, IS the relevant fact. No extra claim to make here.
  if (outcome === 'descriptive') return null;
  if (outcome === 'mixed') {
    return `Provides a conditional indication: ${interpretation}`;
  }
  if (overallOutcome !== 'insufficient_data' && outcome === overallOutcome) {
    return `Supports the ${OUTCOME_LABEL[overallOutcome].toLowerCase()} indication: ${interpretation}`;
  }
  return `Gives a differing indication: ${interpretation}`;
}

function buildIndicator(role: 'primary' | 'supporting', m: MethodResult, overallOutcome: MethodOutcome | 'insufficient_data'): ReadingIndicator {
  const figure = m.calculation!.resultFigure;
  const fortune = figure.qualities.fortune;
  const direction = figure.qualities.direction;
  const outcome = m.verdict?.outcome ?? null;
  const interpretation = m.verdict?.interpretation ?? null;
  // For a descriptive verdict, the generic OUTCOME_LABEL word ("Descriptive")
  // would say nothing useful — the method's own verdict.label already IS
  // the category ("Water", "Eastern"), so that's what gets shown in its place.
  const methodOutcomeLabel = outcome === 'descriptive' ? m.verdict!.label : outcome ? OUTCOME_LABEL[outcome] : null;
  return {
    role,
    figureId: figure.figureId,
    figureName: figure.figureName,
    dotPattern: figure.dotPattern,
    element: ELEMENT_LABEL[figure.element],
    fortune: fortune.status === 'verified' && fortune.value ? FORTUNE_LABEL[fortune.value] : null,
    direction: direction.status === 'verified' && direction.value ? DIRECTION_LABEL[direction.value] : null,
    methodLabel: m.method.label,
    methodStatus: m.method.status,
    housesUsed: figure.sourceHouses,
    methodOutcome: outcome,
    methodOutcomeLabel,
    interpretation,
    relevance: buildRelevance(outcome, overallOutcome, interpretation),
  };
}

/** Section 3: traditional-consistency language, never invented probability.
 * Switches on the ALREADY-DECIDED consensus level; only wording, no new
 * math (consensus.level/overallOutcome both come straight from
 * ruleEngine.ts / COMPARE_RESULTS). */
function buildOverallSummary(overallOutcome: MethodOutcome | 'insufficient_data', consensus: MethodConsensus): string {
  if (overallOutcome === 'insufficient_data') {
    return 'We could not produce a reliable automatic reading from the currently verified source rules.';
  }
  if (overallOutcome === 'descriptive') {
    return consensus.level === 'agree' && consensus.descriptiveAnswer
      ? `The verified methods indicate: ${consensus.descriptiveAnswer}.`
      : 'The verified methods give different answers for this question — see the individual methods below.';
  }
  const label = OUTCOME_LABEL[overallOutcome];
  switch (consensus.level) {
    case 'agree':
      return `${label} — the verified methods agree.`;
    case 'mostly_agree': {
      const dominant = Math.max(consensus.favourableCount, consensus.unfavourableCount, consensus.mixedCount);
      const minority = consensus.verifiableCount - dominant;
      const minorityWord = minority === 1 ? 'one' : numberWord(minority);
      return `Mostly ${label.toLowerCase()} — most verified methods indicate a ${label.toLowerCase()} outcome, with ${minorityWord} conditional or differing indication${minority === 1 ? '' : 's'}.`;
    }
    case 'mixed':
    case 'conflict':
      return 'Mixed — the verified methods give materially different indications.';
    default:
      return label;
  }
}

/** Section 2: a full sentence per outcome type present, never a flat
 * "2 favourable, 1 unfavourable" fragment or a "yes/no" framing. */
function buildConsensusSentence(consensus: MethodConsensus): string | null {
  if (consensus.verifiableCount === 0) return null;
  const parts: string[] = [];
  if (consensus.favourableCount > 0) {
    const n = consensus.favourableCount;
    parts.push(`${capitalize(numberWord(n))} method${n === 1 ? '' : 's'} indicate${n === 1 ? 's' : ''} a favourable outcome.`);
  }
  if (consensus.unfavourableCount > 0) {
    const n = consensus.unfavourableCount;
    parts.push(`${capitalize(numberWord(n))} method${n === 1 ? '' : 's'} indicate${n === 1 ? 's' : ''} an unfavourable outcome.`);
  }
  if (consensus.mixedCount > 0) {
    const n = consensus.mixedCount;
    parts.push(`${capitalize(numberWord(n))} method${n === 1 ? '' : 's'} give${n === 1 ? 's' : ''} a conditional indication.`);
  }
  return parts.join(' ');
}

/** Only fires for a genuine conflict (no dominant side) — a real
 * disagreement is stated as one, never smoothed into "mostly agree"
 * phrasing. Ordinary minority cases are already covered by the consensus
 * sentence above. */
function buildDisagreementNote(consensus: MethodConsensus): string | null {
  if (consensus.level !== 'conflict') return null;
  return 'The traditional methods for this question genuinely disagree — this is preserved as-is, not resolved into a single answer.';
}

export function composeReading(result: EngineResult, question: QuestionDefinition): ReadingResult {
  const consensus = result.calculationDetails.consensus;
  const category = CATEGORIES.find((c) => c.id === question.categoryId)?.label ?? null;
  const isInsufficient = result.overallResult === 'insufficient_data';

  // Prompt 3.5 fix: EngineResult.primaryFigure is ruleEngine.ts's own
  // convention — "the first method with ANY verdict" — which picks a
  // VERIFIED method whose own outcome is itself 'uncertain' (falls outside
  // every branch its rule defines, excluded from the tally) ahead of a
  // later method that actually counted toward the reading. That produced a
  // primary indication card reading "Uncertain" right next to an overall
  // outcome that said "Favourable". This is a display-selection choice, not
  // a calculation change: prefer the first COUNTED method for what the
  // reading FEATURES as primary, falling back to the engine's own choice
  // only when nothing was counted at all (the insufficient-data state,
  // which never renders a primary figure anyway).
  const firstCounted = result.methods.find((m) => m.verdict !== null && m.verdict.outcome !== 'uncertain');
  const primaryMethod = firstCounted ?? result.primaryFigure;
  const primaryFigure = !isInsufficient && primaryMethod?.calculation ? buildIndicator('primary', primaryMethod, result.overallResult) : null;

  const primaryMethodId = primaryMethod?.method.id ?? null;
  const seenFigureIds = new Set(primaryFigure ? [primaryFigure.figureId] : []);
  const supportingIndicators: ReadingIndicator[] = [];
  result.methods.forEach((m) => {
    if (m.method.id === primaryMethodId || !m.calculation) return;
    const figureId = m.calculation.resultFigure.figureId;
    if (seenFigureIds.has(figureId)) return;
    seenFigureIds.add(figureId);
    supportingIndicators.push(buildIndicator('supporting', m, result.overallResult));
  });

  const methodResults: ReadingMethodRow[] = result.methods.map((m) => {
    const counted = m.verdict !== null && m.verdict.outcome !== 'uncertain';
    // Descriptive methods are compared by ANSWER VALUE, not by outcome-type
    // equality (every descriptive verdict has outcome === 'descriptive', so
    // that comparison would trivially always say "agrees"). Method
    // Consistency renders descriptive rows without a check/cross mark at
    // all (see MethodConsistencyCard), so this is left null there — it's
    // only meaningful for the favourable/unfavourable/mixed model.
    const agreesWithOverall =
      counted && result.overallResult !== 'insufficient_data' && m.verdict!.outcome !== 'descriptive'
        ? m.verdict!.outcome === result.overallResult
        : null;
    const resultFigure = m.calculation?.resultFigure ?? null;
    const fortune = resultFigure?.qualities.fortune;
    const direction = resultFigure?.qualities.direction;
    return {
      id: m.method.id,
      label: m.method.label,
      status: m.method.status,
      counted,
      agreesWithOverall,
      outcome: m.verdict?.outcome ?? null,
      outcomeLabel: m.verdict ? (m.verdict.outcome === 'descriptive' ? m.verdict.label : OUTCOME_LABEL[m.verdict.outcome]) : null,
      interpretation: m.verdict?.interpretation ?? null,
      reviewNote: m.method.reviewNote ?? null,
      housesUsed: m.calculation?.housesUsed ?? [],
      calculationSteps: m.calculation?.steps ?? [],
      resultFigureName: resultFigure?.figureName ?? null,
      resultPattern: resultFigure?.dotPattern ?? null,
      resultElement: resultFigure ? ELEMENT_LABEL[resultFigure.element] : null,
      resultFortune: fortune?.status === 'verified' && fortune.value ? FORTUNE_LABEL[fortune.value] : null,
      resultDirection: direction?.status === 'verified' && direction.value ? DIRECTION_LABEL[direction.value] : null,
      sourceQuote: m.method.source.quote,
      sourceLabel: sourceLabelFor(m.method.source),
      casting: toPublicCastingMeta(getEffectiveCastingRequirement(m.method)),
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

  const hasUnverified = result.methods.some((m) => m.method.status !== 'verified');
  const sourceStatus: SourceStatus = isInsufficient ? 'none_verified' : hasUnverified ? 'partially_verified' : 'all_verified';

  return {
    questionId: result.questionId,
    question: result.question,
    questionCategory: category,
    resultKind: consensus.kind,
    overallOutcome: result.overallResult,
    outcomeLabel: OUTCOME_LABEL[result.overallResult],
    descriptiveAnswer: consensus.kind === 'descriptive' ? consensus.descriptiveAnswer : null,
    shortSummary: buildOverallSummary(result.overallResult, consensus),
    detailedInterpretation: result.interpretation,
    primaryFigure,
    supportingIndicators,
    methodResults,
    consensusLabel: CONSENSUS_LABEL[consensus.level],
    consensusSentence: buildConsensusSentence(consensus),
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
