// Core types for the automatic geomancy interpretation engine.
//
// Deliberately built ON TOP of the existing, already-verified pieces rather
// than replacing them:
//   - lib/raml/casting.ts       chart generation (Mothers -> full 16-house Chart) — untouched
//   - content/stars.ts          the 16 named figures, their dot patterns and elements — untouched
//   - content/classicalAttributes.ts  classical-tradition Fortune/Direction per figure — untouched
//   - lib/raml/classicalVerdict.ts    addition/lookup helpers (combineHouses, isFoundInChart, ...) — reused
//
// This file only adds the vocabulary needed to (a) represent a chart's
// houses with their FULL quality set, honestly marking which qualities are
// actually sourced and which are not, and (b) describe a traditional
// question's methods and the engine's calculated answer to them.

import type { Element, Pattern } from '@/content/stars';
import type { HouseRole } from '../houses';
import type { CastingRequirement } from './castingRequirement';

export type {
  UserCastInput,
  MethodInspects,
  AppDerivation,
  ResultDisplay,
  CastingEvidence,
  CastingRequirement,
  PublicCastingMeta,
  QuestionCastingResolution,
} from './castingRequirement';

// ---------------------------------------------------------------------------
// Provenance / trust
// ---------------------------------------------------------------------------

/**
 * Every rule and every quality value carries one of these, per the project's
 * source-fidelity rule: never silently invent a value the source material
 * doesn't actually support.
 *   - verified:     read directly off the manuscript text (or, for
 *                   good/bad/upward-downward, off the labeled classical-
 *                   tradition mapping this project already uses elsewhere —
 *                   "verified" here means "the VALUE is well-defined and
 *                   computable," not "the manuscript itself states it").
 *   - needs_review: the source describes the quality/rule in principle, but
 *                   this codebase has no verified table for it yet (e.g.
 *                   male/female, day/night, stable/unstable — the source's
 *                   own edition note names these as real qualities the book
 *                   uses, but never tabulates which figure carries which).
 *   - uncertain:    the specific source passage needed to compute this could
 *                   not be read with confidence (most often: the method
 *                   depends on named/drawn figures the PDF transcription
 *                   marked as "[figures omitted]").
 */
export type RuleStatus = 'verified' | 'needs_review' | 'uncertain';

export type QualitySource =
  | { kind: 'manuscript'; note?: string }
  | { kind: 'classical-tradition'; note?: string }
  | { kind: 'unsourced'; note: string };

export interface QualityValue<T> {
  value: T | null;
  status: RuleStatus;
  source: QualitySource;
}

// ---------------------------------------------------------------------------
// Chart data model (section 2)
// ---------------------------------------------------------------------------

export type LineState = 'opened' | 'closed'; // manuscript's own definition: single dot = opened, double = closed

export interface LineStates {
  fire: LineState;
  air: LineState;
  water: LineState;
  sand: LineState;
}

/** Every quality the source tradition recognizes for a figure — populated
 * where this project has a verified value, explicitly flagged where it
 * doesn't. Nothing here is guessed. */
export interface FigureQualities {
  fortune: QualityValue<'good' | 'middleGood' | 'bad'>;
  direction: QualityValue<'upward' | 'downward'>; // null value = "level", genuinely ambiguous on this axis
  lineStates: LineStates; // always verified — defined directly by the manuscript
  stability: QualityValue<'stable' | 'unstable'>; // always needs_review — not sourced
  gender: QualityValue<'male' | 'female'>; // always needs_review — not sourced
  dayNight: QualityValue<'day' | 'night'>; // always needs_review — not sourced
}

export interface HouseModel {
  houseNumber: number; // 1-16
  role: HouseRole;
  figureId: string;
  figureName: string;
  classicalName: string;
  dotPattern: Pattern;
  element: Element;
  qualities: FigureQualities;
}

export interface ChartModel {
  houses: HouseModel[]; // length 16, index 0 = H1
  createdAt: string;
}

/** A figure computed by combining/extracting from the chart, that doesn't
 * itself occupy one of the 16 houses (e.g. a method's "add H1+H5" result, or
 * an element-extraction synthetic figure). Same shape as a HouseModel minus
 * the house-specific fields, so operations can treat both uniformly. */
export type ComputedFigure = Omit<HouseModel, 'houseNumber' | 'role'> & {
  sourceHouses: number[]; // which houses were combined/extracted to produce this
};

// ---------------------------------------------------------------------------
// Operations (section 7) — see engine/operations.ts for implementations.
// This is just the shared trace shape every operation returns for the audit
// trail.
// ---------------------------------------------------------------------------

export interface OperationTrace {
  operation: string; // e.g. "ADD_FIGURES", "CHECK_HOUSE", "EXTRACT_ELEMENT"
  description: string; // human-readable, e.g. "H3 (Mahadi) + H7 (Umar) = Ibrahim"
}

// ---------------------------------------------------------------------------
// Rule schema (sections 3-6) — a question maps to one or more traditional
// methods; each method is calculated by a small typed function built only
// from the shared operations, then evaluated into a verdict.
//
// Why not a fully declarative JSON step language? It was considered, and
// rejected for THIS phase: the five pilot chapters alone contain add, add-
// then-add-to-another-house, per-element extraction into a synthetic figure,
// "found elsewhere in the chart", and an AND-condition across two separate
// houses — a generic interpreter general enough to cover all of these without
// special-casing each shape would be *more* code than just calling the
// shared operations directly, and would still need per-method escape hatches
// for anything it didn't anticipate. Keeping each method a small function
// built from operations.ts keeps the primitives themselves reusable and
// independently testable (satisfying section 7) without pretending the
// source material is more uniform than it is. A declarative layer on top of
// these same operations remains a natural later addition once enough real
// methods make its shape obvious.
// ---------------------------------------------------------------------------

// Prompt 4.5: 'descriptive' is for a genuinely different KIND of answer —
// not "we don't trust this verdict" (that's what 'uncertain' already means)
// but "this method computes a real, verified, categorical fact that was
// never favourable/unfavourable/mixed to begin with" (e.g. chapter 23's
// terrain type, chapter 31's thief location, chapter 36's compass
// direction). Before this, such methods were forced to `status:
// 'needs_review'` purely because the engine had no outcome value for them —
// an architectural workaround, not a real source-verification gap. A
// 'descriptive' verdict is a full, counted, VERIFIED result; it is simply
// compared across methods by answer-equality (see COMPARE_RESULTS) rather
// than by favourable/unfavourable/mixed tallying.
export type MethodOutcome = 'favourable' | 'unfavourable' | 'mixed' | 'uncertain' | 'descriptive';

export interface MethodCalculation {
  housesUsed: number[];
  steps: string[]; // human-readable calculation trace, in order
  resultFigure: ComputedFigure;
}

export interface MethodVerdict {
  outcome: MethodOutcome;
  label: string; // short tag, e.g. "Good and Upward", "Found in chart" — for a descriptive verdict, a short category name like "Water" or "Eastern"
  interpretation: string; // deterministic natural-language sentence
  /** Only set when outcome === 'descriptive': a normalized answer value
   * (e.g. "water", "east") used ONLY to compare methods for agreement —
   * never displayed raw, never a favourable/unfavourable judgment. */
  descriptiveAnswer?: string;
}

export interface SourceRef {
  book: 'kanzul-mikban' | 'master-of-geomancy-vol-1';
  chapterId: string;
  quote: string; // the exact source sentence(s) this method implements
}

/** Prompt 6 (source reconciliation audit): a machine-readable category for
 * WHY a method is needs_review/uncertain — narrower and filterable, unlike
 * the free-text `reviewNote` every such method already carries. Optional,
 * additive, and only assigned where a method's blocker matches a genuinely
 * recurring category (not invented per-method) — most needs_review/
 * uncertain methods still rely on `reviewNote` alone, and that remains
 * exactly as valid. Currently used for the male/female-star gender gap
 * (chapter 41 Method 1, chapter 48 Methods 1-2 — see COVERAGE.md's "Prompt
 * 6" section for the full reasoning and the confirmed absence of any
 * authoritative source for this classification anywhere in either
 * manuscript). The other values name categories identified during that same
 * audit for chapters not registered in this engine at all (chapter 46's
 * ritual practice, chapter 59's open-ended methods) — documented in
 * COVERAGE.md rather than attached to a live MethodDefinition, since no
 * such chapter has one. */
export type ReviewReasonCode =
  | 'gender_classification_unsourced'
  | 'whole_figure_state_undefined'
  | 'figures_omitted_by_transcription'
  | 'open_ended_by_design'
  | 'ritual_not_a_reading'
  | 'spatial_layout_unsupported'
  | 'separate_casting_mechanism'
  // Prompt 7: the source states a method's calculation in full (houses,
  // even the good/middle-good/bad classification to check) but the passage
  // itself ends without ever stating what any branch MEANS — distinct from
  // an omitted figure (the calculation is complete) and from an ambiguous
  // split (there's no stated interpretation to be ambiguous about at all).
  // First seen at chapter 64 Method 2.
  | 'interpretation_not_stated'
  // Prompt 9: three more of the project's known-since-Prompt-1 unsourced
  // FigureQualities axes (see the RuleStatus doc comment above — "day/
  // night, stable/unstable" were named as real book qualities from the
  // very start, but chapters 1-80 never happened to need them) are hit for
  // the first time by chapters 81-100. Each gets its own code, matching
  // gender_classification_unsourced's own precedent, so future audits can
  // tell at a glance which specific unsourced axis blocks a given method.
  // day/night: chapter 83. stability: chapter 85 Method 2, the "secrets
  // between two friends" fragment's unreachable else-branch, and chapter
  // 86 Method 2. temporal (present/past/future star — a classification
  // this project has never even declared a FigureQualities field for,
  // let alone sourced): chapter 91, its only occurrence anywhere in
  // either manuscript.
  | 'day_night_classification_unsourced'
  | 'stability_classification_unsourced'
  | 'temporal_classification_unsourced'
  // Prompt 10: the source names several recurring "constant figure"
  // techniques (Sirri Sa'ael/Damir, Nazir, Nutik, Itisal, Ifusal — all
  // named together in the book's own front matter, KM_EDITION_NOTE) that
  // a method adds to a house's own figure — but never states any of
  // their actual dot-patterns anywhere in either manuscript. Distinct
  // from figures_omitted_by_transcription (a BRANCH's trigger list is
  // missing from an otherwise-computable rule): here the very FIRST step
  // of the calculation has no value to start from. Sirri Sa'ael's own
  // occurrences (ch.2 M4, ch.26) predate this code and were left as
  // plain `uncertain` with no code, per the project's practice of only
  // adding a new code when a category recurs enough to be worth
  // distinguishing precisely — first added here since it recurs 4 times
  // in chapters 101-120 alone (Nazir ch.107, Nutik ch.108, Itisal ch.118,
  // Ifusal ch.119).
  | 'constant_figure_undefined';

export interface MethodDefinition {
  id: string;
  label: string; // "Method 1"
  status: RuleStatus;
  reviewNote?: string; // required when status !== 'verified'
  /** Optional machine-readable companion to `reviewNote` — see
   * ReviewReasonCode's own doc comment. */
  reviewReasonCode?: ReviewReasonCode;
  source: SourceRef;
  /**
   * Optional casting-requirement metadata (Prompt 65). Method is the source
   * of truth. Omitted = not yet classified: getEffectiveCastingRequirement
   * returns the product default (today's four-Mother / full-shield pipeline).
   * That default is NOT a source claim that the manuscript requires a full
   * shield. Unused by Cast UI / ResultTabs / calculate() in this prompt.
   */
  castingRequirement?: CastingRequirement;
  /** LAYER 1 — calculation. Pure, deterministic, no phrasing. */
  calculate: (chart: ChartModel) => MethodCalculation;
  /** LAYER 2 — interpretation. Turns a calculation into a verdict. Still
   * deterministic (rule-based), never a free-text model call — see section 14. */
  evaluate: (calc: MethodCalculation, chart: ChartModel) => MethodVerdict;
}

export interface QuestionDefinition {
  id: string; // matches content/intentions.ts intention id, so the existing
  // casting-flow question picker can drive this engine with zero new UI
  title: string;
  categoryId: string;
  chapterId: string;
  /** Optional; defaults to 'outcome' when omitted, so every pre-existing
   * question file needs no change. 'descriptive' marks a question whose
   * methods answer a categorical fact (terrain, direction, location) rather
   * than a favourable/unfavourable verdict — see MethodOutcome. */
  resultKind?: 'outcome' | 'descriptive';
  methods: MethodDefinition[];
}

// ---------------------------------------------------------------------------
// Engine result (sections 3, 5, 9, 10)
// ---------------------------------------------------------------------------

// 'disagree' is descriptive-only: two or more counted methods produced
// different categorical answers (e.g. one says "east", another "west").
// It is deliberately distinct from 'conflict' (an outcome question's
// genuine favourable-vs-unfavourable clash) — a plain factual mismatch is
// not the same kind of disagreement as two traditional methods contradicting
// each other's judgment, even though both are shown just as honestly.
export type ConsensusLevel = 'agree' | 'mostly_agree' | 'mixed' | 'conflict' | 'disagree' | 'insufficient_data';

export interface MethodResult {
  method: Pick<MethodDefinition, 'id' | 'label' | 'status' | 'reviewNote' | 'source'>;
  calculation: MethodCalculation | null; // null only if calculate() itself threw (should not happen for verified methods)
  verdict: MethodVerdict | null; // null when status is not 'verified' or calculation failed
}

export interface MethodConsensus {
  /** Which comparison model produced this consensus — 'outcome' tallies
   * favourable/unfavourable/mixed as before; 'descriptive' compares
   * categorical answers for equality instead. Sets which of `level`'s
   * values are actually reachable (a descriptive consensus is only ever
   * 'agree', 'disagree', or 'insufficient_data'). */
  kind: 'outcome' | 'descriptive';
  level: ConsensusLevel;
  favourableCount: number;
  unfavourableCount: number;
  mixedCount: number;
  uncertainCount: number;
  verifiableCount: number;
  summary: string;
  /** Only meaningful when kind === 'descriptive': the shared answer's
   * human-readable label (the agreeing method's own `verdict.label`, e.g.
   * "Northern direction" — never the raw `MethodVerdict.descriptiveAnswer`
   * comparison key, e.g. "water") when every counted method agrees; null
   * when they disagree, when nothing was computable, or for an ordinary
   * outcome-kind question. */
  descriptiveAnswer: string | null;
}

export interface EngineResult {
  questionId: string;
  question: string;
  overallResult: MethodOutcome | 'insufficient_data';
  summary: string;
  primaryFigure: MethodResult | null; // the first verified method's result, by convention
  supportingHouses: number[]; // union of every house any method touched
  methods: MethodResult[];
  interpretation: string;
  calculationDetails: {
    consensus: MethodConsensus;
  };
}
