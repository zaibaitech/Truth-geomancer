// Chapter 151 ("Dreams and Their Interpretations") — the author-clarified
// pairing procedure (Umuhat 1+2, Umuhat 3+4, then those two results
// together) implemented in
// lib/raml/engine/questions/dreamsAndInterpretations.ts. Tests A-L from the
// registration prompt: direct unit coverage of the arithmetic (never just
// a snapshot), the full question-level result shape, the duplicate
// handling, registry state, and catalogue wording.
import { describe, expect, it } from 'vitest';
import { buildChart } from '../../casting';
import { buildChartModel } from '../chartModel';
import { ADD_FIGURES, ADD_MULTIPLE_HOUSES, CHECK_HOUSE } from '../operations';
import { QUESTION_REGISTRY } from '../questions';
import { runEngine, runReading } from '../index';
import { getQuestionAvailability } from '@/lib/raml/questionAvailability';
import { catalogEntry } from '@/lib/raml/questionCatalog';
import {
  computePrimaryStatus,
  primaryAnswerText,
  primaryDisplayedInterpretation,
  shouldShowShortSummary,
} from '@/lib/raml/resultPresentation';
import type { Pattern } from '@/content/stars';

const CH151_ID = 'dreams-and-their-interpretations';

// Three independently hand-verified fixtures (arithmetic checked by hand
// against addRows' own documented rule — same value -> 2, different -> 1 —
// before being relied on here), chosen to cover: an ordinary single-match
// result, a different ordinary single-match result, and the one genuine
// source duplicate (#1 and #4, both Yussif).
const FIXTURES: {
  name: string;
  mothers: [Pattern, Pattern, Pattern, Pattern];
  pairA: Pattern; // H1+H2
  pairB: Pattern; // H3+H4
  final: Pattern; // pairA+pairB
  finalStarId: string;
  matches: number[];
}[] = [
  {
    name: 'fixture chart (Yussif/Adam/Mahadi/Iddris)',
    mothers: [
      [1, 1, 2, 1], // Yussif
      [1, 2, 2, 2], // Adam
      [2, 1, 1, 1], // Mahadi
      [2, 2, 1, 2], // Iddris
    ],
    pairA: [2, 1, 2, 1], // Usman
    pairB: [2, 1, 2, 1], // Usman
    final: [2, 2, 2, 2], // Musah
    finalStarId: 'musah',
    matches: [16],
  },
  {
    name: 'second fixture (Ibrahim/Musah/Yussif/Nuhu) — Musah acts as an identity element',
    mothers: [
      [1, 1, 1, 1], // Ibrahim
      [2, 2, 2, 2], // Musah
      [1, 1, 2, 1], // Yussif
      [2, 2, 1, 1], // Nuhu
    ],
    pairA: [1, 1, 1, 1], // Ibrahim (Musah is an identity element under addPatterns)
    pairB: [1, 1, 1, 2], // Hassan & Hussein
    final: [2, 2, 2, 1], // Ayuba
    finalStarId: 'ayuba',
    matches: [8],
  },
  {
    name: 'duplicate fixture (Ibrahim/Ibrahim/Ibrahim/Iddris) — final figure is the genuine Yussif duplicate',
    mothers: [
      [1, 1, 1, 1], // Ibrahim
      [1, 1, 1, 1], // Ibrahim (repeated — a real chart can cast the same Mother twice)
      [1, 1, 1, 1], // Ibrahim
      [2, 2, 1, 2], // Iddris
    ],
    pairA: [2, 2, 2, 2], // Musah
    pairB: [1, 1, 2, 1], // Yussif
    final: [1, 1, 2, 1], // Yussif
    finalStarId: 'yussif',
    matches: [1, 4],
  },
];

describe('Test B/C/D: the pairing arithmetic itself, at the operation level (direct unit coverage)', () => {
  for (const f of FIXTURES) {
    describe(f.name, () => {
      const chart = buildChartModel(buildChart(f.mothers));

      it('Umuhat 1-4 are exactly H1-H4 of the chart, unchanged', () => {
        expect(CHECK_HOUSE(chart, 1).figure.dotPattern).toEqual(f.mothers[0]);
        expect(CHECK_HOUSE(chart, 2).figure.dotPattern).toEqual(f.mothers[1]);
        expect(CHECK_HOUSE(chart, 3).figure.dotPattern).toEqual(f.mothers[2]);
        expect(CHECK_HOUSE(chart, 4).figure.dotPattern).toEqual(f.mothers[3]);
      });

      it('Test B: pair(Umuhat 1, Umuhat 2) uses the canonical ADD_MULTIPLE_HOUSES operation and produces the expected figure', () => {
        const { figure } = ADD_MULTIPLE_HOUSES(chart, [1, 2]);
        expect(figure.dotPattern).toEqual(f.pairA);
      });

      it('Test C: pair(Umuhat 3, Umuhat 4) uses the canonical ADD_MULTIPLE_HOUSES operation and produces the expected figure', () => {
        const { figure } = ADD_MULTIPLE_HOUSES(chart, [3, 4]);
        expect(figure.dotPattern).toEqual(f.pairB);
      });

      it('Test D: pair(resultA, resultB) uses the canonical ADD_FIGURES operation and produces the exact final figure', () => {
        const pairA = ADD_MULTIPLE_HOUSES(chart, [1, 2]).figure;
        const pairB = ADD_MULTIPLE_HOUSES(chart, [3, 4]).figure;
        const { figure } = ADD_FIGURES([pairA, pairB]);
        expect(figure.dotPattern).toEqual(f.final);
        expect(figure.figureId).toBe(f.finalStarId);
      });
    });
  }
});

describe('Test E: the method never touches H5-H16 or Daughters/Nieces/Witnesses/Judge', () => {
  for (const f of FIXTURES) {
    it(`${f.name}: housesUsed is exactly [1,2,3,4]`, () => {
      const result = runEngine(buildChart(f.mothers), CH151_ID)!;
      expect(result.methods[0].calculation!.housesUsed).toEqual([1, 2, 3, 4]);
    });
  }
});

describe('Test J: a Chapter 151 reading produces four Umuhat, two intermediate pairs, one final figure, and the matched interpretation', () => {
  for (const f of FIXTURES) {
    it(`${f.name}`, () => {
      const result = runEngine(buildChart(f.mothers), CH151_ID)!;
      const calc = result.methods[0].calculation!;
      const verdict = result.methods[0].verdict!;

      expect(calc.steps.some((s) => s.startsWith('Umuhat 1 ='))).toBe(true);
      expect(calc.steps.some((s) => s.startsWith('Umuhat 2 ='))).toBe(true);
      expect(calc.steps.some((s) => s.startsWith('Umuhat 3 ='))).toBe(true);
      expect(calc.steps.some((s) => s.startsWith('Umuhat 4 ='))).toBe(true);
      expect(calc.steps.some((s) => s.startsWith('Pair 1:'))).toBe(true);
      expect(calc.steps.some((s) => s.startsWith('Pair 2:'))).toBe(true);
      expect(calc.steps.some((s) => s.startsWith('Final pairing:'))).toBe(true);

      expect(calc.resultFigure.dotPattern).toEqual(f.final);
      expect(calc.resultFigure.figureId).toBe(f.finalStarId);

      expect(verdict.outcome).toBe('descriptive');
      expect(verdict.interpretation.length).toBeGreaterThan(0);
      f.matches.forEach((n) => expect(verdict.label).toContain(`#${n}`));
    });
  }
});

describe('Test H: the genuine #1/#4 duplicate is represented faithfully, never silently dropped', () => {
  it('the duplicate fixture resolves to BOTH #1 and #4 in the verdict, not just one', () => {
    const duplicate = FIXTURES[2];
    const result = runEngine(buildChart(duplicate.mothers), CH151_ID)!;
    const verdict = result.methods[0].verdict!;
    expect(verdict.label).toContain('#1');
    expect(verdict.label).toContain('#4');
    expect(verdict.interpretation).toContain('1.');
    expect(verdict.interpretation).toContain('4.');
    expect(verdict.descriptiveAnswer).toBe('interpretation-1-4');
  });
});

describe('Test I: Chapter 151 is registered for automatic reading', () => {
  it('QUESTION_REGISTRY has a real entry with at least one verified method', () => {
    const question = QUESTION_REGISTRY[CH151_ID];
    expect(question).toBeDefined();
    expect(question.methods.length).toBeGreaterThan(0);
    expect(question.methods.some((m) => m.status === 'verified')).toBe(true);
    expect(question.resultKind).toBe('descriptive');
  });
});

describe('Test K: the catalogue no longer shows "Method undefined" or "Figures missing" for Chapter 151', () => {
  it('getQuestionAvailability returns a plain engine entry', () => {
    expect(getQuestionAvailability(CH151_ID).kind).toBe('engine');
  });

  it('the catalogue entry carries no badge at all', () => {
    const entry = catalogEntry(CH151_ID)!;
    expect(entry.availability.kind).not.toBe('no-automatic-reading');
  });
});

// Presentation-layer coverage only: composeReading already preserved the
// source interpretation, and the primary card now surfaces it. These
// assertions never re-derive the pairing arithmetic.
const IBRAHIM_MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 1, 1], // Ibrahim
  [2, 2, 2, 2], // Musah (identity)
  [2, 2, 2, 2], // Musah
  [2, 2, 2, 2], // Musah → final figure Ibrahim = interpretation #5
];

describe('presentation: the source interpretation is preserved and shown, calculation unchanged', () => {
  it('Ibrahim (#5): composeReading keeps the source text, and the primary card shows both the figure label and that text', () => {
    const chart = buildChart(IBRAHIM_MOTHERS);
    const engine = runEngine(chart, CH151_ID)!;
    const reading = runReading(chart, CH151_ID)!;
    const verdict = engine.methods[0].verdict!;

    expect(engine.methods[0].calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(verdict.label).toBe('Interpretation #5 — Ibrahim');
    expect(reading.descriptiveAnswer).toBe('Interpretation #5 — Ibrahim');
    expect(reading.methodResults[0].interpretation).toBe(verdict.interpretation);
    expect(reading.primaryFigure?.interpretation).toBe(verdict.interpretation);
    expect(verdict.interpretation).toContain('white house-bird');

    const status = computePrimaryStatus(reading);
    expect(primaryAnswerText(reading, status)).toBe('Interpretation #5 — Ibrahim');
    expect(primaryDisplayedInterpretation(reading, status)).toBe(verdict.interpretation);
    expect(shouldShowShortSummary(reading, verdict.interpretation, status)).toBe(false);
  });

  it('Ayuba (#8): the primary card shows that figure\'s own interpretation, not Ibrahim\'s', () => {
    const ayuba = FIXTURES[1];
    const chart = buildChart(ayuba.mothers);
    const engine = runEngine(chart, CH151_ID)!;
    const reading = runReading(chart, CH151_ID)!;
    const verdict = engine.methods[0].verdict!;

    expect(engine.methods[0].calculation!.resultFigure.figureId).toBe('ayuba');
    expect(verdict.label).toContain('#8');
    expect(primaryAnswerText(reading, computePrimaryStatus(reading))).toBe(verdict.label);
    expect(primaryDisplayedInterpretation(reading)).toBe(verdict.interpretation);
    expect(primaryDisplayedInterpretation(reading)).not.toBe(
      runReading(buildChart(IBRAHIM_MOTHERS), CH151_ID)!.methodResults[0].interpretation,
    );
    expect(primaryDisplayedInterpretation(reading)).toMatch(/funeral/i);
    expect(primaryDisplayedInterpretation(reading)).not.toMatch(/white house-bird/);
  });
});
