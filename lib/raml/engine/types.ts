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

export type MethodOutcome = 'favourable' | 'unfavourable' | 'mixed' | 'uncertain';

export interface MethodCalculation {
  housesUsed: number[];
  steps: string[]; // human-readable calculation trace, in order
  resultFigure: ComputedFigure;
}

export interface MethodVerdict {
  outcome: MethodOutcome;
  label: string; // short tag, e.g. "Good and Upward", "Found in chart"
  interpretation: string; // deterministic natural-language sentence
}

export interface SourceRef {
  book: 'kanzul-mikban' | 'master-of-geomancy-vol-1';
  chapterId: string;
  quote: string; // the exact source sentence(s) this method implements
}

export interface MethodDefinition {
  id: string;
  label: string; // "Method 1"
  status: RuleStatus;
  reviewNote?: string; // required when status !== 'verified'
  source: SourceRef;
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
  methods: MethodDefinition[];
}

// ---------------------------------------------------------------------------
// Engine result (sections 3, 5, 9, 10)
// ---------------------------------------------------------------------------

export type ConsensusLevel = 'agree' | 'mostly_agree' | 'mixed' | 'conflict' | 'insufficient_data';

export interface MethodResult {
  method: Pick<MethodDefinition, 'id' | 'label' | 'status' | 'reviewNote' | 'source'>;
  calculation: MethodCalculation | null; // null only if calculate() itself threw (should not happen for verified methods)
  verdict: MethodVerdict | null; // null when status is not 'verified' or calculation failed
}

export interface MethodConsensus {
  level: ConsensusLevel;
  favourableCount: number;
  unfavourableCount: number;
  mixedCount: number;
  uncertainCount: number;
  verifiableCount: number;
  summary: string;
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
