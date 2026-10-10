// Free-cast result, Phase A: presentation-only helpers that turn an already
// authorised ReadingResult (plus the user's own chart) into
//   1. the ANSWER: each counted method's own conclusion, attributed to its
//      book, chapter and method, with an accurate count/agreement line, and
//   2. the REASONING STEPS: the houses each method used, the figure sitting in
//      each, the engine's own working line and the result figure.
//
// Nothing here calculates, ranks or rewrites anything. Every string shown is
// either a field of the ReadingResult/Chart or one of the labels in this
// file; a method's sentence is shown verbatim (never made unconditional), and
// when counted methods differ every method's sentence is shown with no
// preferred winner. Descriptive, insufficient and source-silent readings are
// returned as 'legacy' so they keep their existing presentation untouched.
//
// Client-safe by construction: it imports only types, the shared outcome
// labels, the free house framework and the existing presentation helpers —
// never lib/server, the engine's questions, or any manuscript text.
import type { Chart } from '@/lib/raml/casting';
import type { Pattern } from '@/content/stars';
import type { ReadingMethodRow, ReadingResult } from '@/lib/raml/engine/reading';
import type { MethodOutcome } from '@/lib/raml/engine/types';
import { houseInfo } from '@/lib/raml/houses';
import { isSourceSilentReading } from '@/lib/raml/resultPresentation';

/** The outcome chip wording. Kept here, not imported from lib/raml/engine/reading.ts, so that
 * this module (reached by the public book pages through reading history) never pulls the engine's
 * reading module and its source tables into a public route's client bundle. A test pins it to
 * the engine's own OUTCOME_ROW_LABEL. */
const OUTCOME_ROW_LABEL: Record<MethodOutcome, string> = {
  favourable: 'Favourable',
  unfavourable: 'Unfavourable',
  mixed: 'Conditional / Mixed',
  uncertain: 'Uncertain',
  descriptive: 'Descriptive',
};

/** Shown under every answer. An interpretation, never a promise. */
export const STANDING_NOTE = 'A traditional reading is an interpretation to reflect on, not a guarantee of a future event.';

export interface AnswerMethodRef {
  label: string; // "Method 1"
  sourceLabel: string; // "Kanzul Mikban, Chapter 146"
}

/** One distinct conclusion, with every counted method that gave it. */
export interface AnswerGroup {
  /** The method's own interpretation, verbatim. */
  sentence: string;
  outcome: Exclude<MethodOutcome, 'descriptive' | 'uncertain'>;
  outcomeLabel: string;
  methods: AnswerMethodRef[];
}

export interface AnswerView {
  /** 'legacy' = keep the existing OutcomeCard (descriptive, insufficient, source-silent, or anything incomplete). */
  kind: 'legacy' | 'single' | 'agree' | 'differ';
  /** Accurate count + agreement wording, e.g. "2 verified methods agree." */
  statusLine: string;
  groups: AnswerGroup[];
  /** Extra, existing-engine wording for differing methods (consensus sentence, genuine-conflict note). */
  detailLines: string[];
  note: string;
}

const LEGACY: AnswerView = { kind: 'legacy', statusLine: '', groups: [], detailLines: [], note: STANDING_NOTE };

/** "According to Kanzul Mikban, Chapter 146, Method 1:" (methods joined plainly). */
export function attributionLine(methods: AnswerMethodRef[]): string {
  const bySource: { source: string; labels: string[] }[] = [];
  for (const m of methods) {
    const entry = bySource.find((e) => e.source === m.sourceLabel);
    if (entry) entry.labels.push(m.label);
    else bySource.push({ source: m.sourceLabel, labels: [m.label] });
  }
  return `According to ${bySource.map((e) => `${e.source}, ${e.labels.join(' and ')}`).join(' and ')}:`;
}

type CountedRow = ReadingMethodRow & { interpretation: string; outcome: AnswerGroup['outcome'] };

function countedOutcomeRows(result: ReadingResult): CountedRow[] | null {
  const counted = result.methodResults.filter((m) => m.counted);
  if (counted.length === 0) return null;
  const rows: CountedRow[] = [];
  for (const m of counted) {
    const sentence = m.interpretation?.trim();
    if (!sentence || !m.outcome || m.outcome === 'descriptive' || m.outcome === 'uncertain') return null;
    rows.push({ ...m, interpretation: sentence, outcome: m.outcome });
  }
  return rows;
}

export function buildAnswerView(result: ReadingResult): AnswerView {
  if (result.resultKind !== 'outcome' || result.isInsufficient || isSourceSilentReading(result)) return LEGACY;
  const rows = countedOutcomeRows(result);
  if (!rows) return LEGACY;

  const groups: AnswerGroup[] = [];
  for (const r of rows) {
    const existing = groups.find((g) => g.sentence === r.interpretation && g.outcome === r.outcome);
    const ref = { label: r.label, sourceLabel: r.sourceLabel };
    if (existing) existing.methods.push(ref);
    else groups.push({ sentence: r.interpretation, outcome: r.outcome, outcomeLabel: OUTCOME_ROW_LABEL[r.outcome], methods: [ref] });
  }

  if (rows.length === 1) {
    return { kind: 'single', statusLine: 'Given by 1 verified method.', groups, detailLines: [], note: STANDING_NOTE };
  }
  const sameOutcome = new Set(rows.map((r) => r.outcome)).size === 1;
  if (sameOutcome) {
    return { kind: 'agree', statusLine: `${rows.length} verified methods reach the same indication.`, groups, detailLines: [], note: STANDING_NOTE };
  }
  const detailLines = [result.consensusSentence, result.disagreementNote].filter((s): s is string => !!s);
  return {
    kind: 'differ',
    statusLine: `${rows.length} verified methods give different indications.`,
    groups,
    detailLines,
    note: STANDING_NOTE,
  };
}

// ---------------------------------------------------------------------------
// Reasoning steps
// ---------------------------------------------------------------------------

export interface StepHouse {
  number: number;
  title: string; // the app's own house name (lib/raml/houses.ts)
  figureName: string;
  pattern: Pattern;
}

export interface ReasoningStep {
  methodId: string;
  methodLabel: string;
  sourceLabel: string;
  houses: StepHouse[];
  /** The engine's own working lines, verbatim. */
  working: string[];
  result: { name: string; pattern: Pattern; element: string | null } | null;
  row: ReadingMethodRow;
}

/** One step block per counted method whose houses can be read straight off the user's chart. Recast methods keep their own diagram. */
export function buildReasoningSteps(result: ReadingResult, chart: Chart | undefined): ReasoningStep[] {
  if (!chart || buildAnswerView(result).kind === 'legacy') return [];
  const steps: ReasoningStep[] = [];
  for (const m of result.methodResults) {
    if (!m.counted || m.casting.inspects === 'recast' || m.housesUsed.length === 0) continue;
    const houses: StepHouse[] = [];
    for (const n of m.housesUsed) {
      const h = chart.houses[n - 1];
      if (!h || h.n !== n) break;
      houses.push({ number: n, title: houseInfo(n).title, figureName: h.star.name, pattern: h.pattern });
    }
    if (houses.length !== m.housesUsed.length) continue;
    steps.push({
      methodId: m.id,
      methodLabel: m.label,
      sourceLabel: m.sourceLabel,
      houses,
      working: m.calculationSteps,
      result: m.resultFigureName && m.resultPattern ? { name: m.resultFigureName, pattern: m.resultPattern, element: m.resultElement } : null,
      row: m,
    });
  }
  return steps;
}
