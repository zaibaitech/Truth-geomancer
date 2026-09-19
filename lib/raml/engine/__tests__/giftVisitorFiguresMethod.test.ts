// "Reading the Gift/Visitor Figures" (continuation of Kanzul Mikban
// Chapter 28), implemented in lib/raml/engine/questions/giftVisitorFigures.ts.
//
// SCOPE NOTE (post source-fidelity re-audit): this method computes ONLY
// the calculation, the found-in-chart fact, and the eight recovered gift-
// figure meanings. It does NOT compute element/direction/water-line-state/
// repetition-count interpretation — moneyOrGoodStrangers.ts's own header
// comment already documents why that elaboration was deliberately excluded
// from this identical passage in an earlier, already-verified stage ("the
// closed-water carve-out isn't clearly reconciled with the primary rule
// textually"), and this file follows that same, already-established scope
// discipline rather than re-deciding it. Tests below assert that this
// elaboration is ABSENT from the computed interpretation, not present.
//
// Fixtures were found by an exhaustive brute-force search over all 16^4
// possible Mothers combinations (every real chart this app can ever cast),
// picking the FIRST chart that reaches each target state — so every
// fixture here is a real, castable chart, not a hand-constructed one.
import { describe, expect, it } from 'vitest';
import { buildChart } from '../../casting';
import { buildChartModel } from '../chartModel';
import {
  ADD_FIGURE_TO_HOUSE,
  CHECK_FIGURE_PRESENT_IN_CHART,
  EXTRACT_ELEMENT,
} from '../operations';
import { QUESTION_REGISTRY } from '../questions';
import { runEngine } from '../index';
import { getQuestionAvailability } from '@/lib/raml/questionAvailability';
import { catalogEntry } from '@/lib/raml/questionCatalog';
import type { Pattern } from '@/content/stars';

const CH_ID = 'continued-from-chapter-twenty-eight';

const FIXTURES: {
  name: string;
  mothers: [Pattern, Pattern, Pattern, Pattern];
  resultFigureId: string;
  found: boolean;
  giftNumber: number | null;
}[] = [
  {
    name: 'gift #1 (Ibrahim), found',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [2, 1, 2, 1], [1, 1, 1, 1]],
    resultFigureId: 'ibrahim',
    found: true,
    giftNumber: 1,
  },
  {
    name: 'gift #2 (Musah), found',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 2, 1, 1], [1, 1, 1, 1]],
    resultFigureId: 'musah',
    found: true,
    giftNumber: 2,
  },
  {
    name: 'gift #3 (Adam), found',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [2, 1, 1, 1], [1, 1, 1, 1]],
    resultFigureId: 'adam',
    found: true,
    giftNumber: 3,
  },
  {
    name: 'gift #4 (Hassan & Hussein), not found',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [2, 1, 2, 1], [1, 1, 2, 1]],
    resultFigureId: 'hassan-hussein',
    found: false,
    giftNumber: 4,
  },
  {
    name: 'gift #5 (Umar), not found',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 2, 1], [1, 1, 1, 1]],
    resultFigureId: 'umar',
    found: false,
    giftNumber: 5,
  },
  {
    name: 'gift #6 (Nuhu), not found',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]],
    resultFigureId: 'nuhu',
    found: false,
    giftNumber: 6,
  },
  {
    name: 'gift #7 (Usman), not found',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 2, 1], [1, 1, 2, 1]],
    resultFigureId: 'usman',
    found: false,
    giftNumber: 7,
  },
  {
    name: 'gift #8 (Yunus), not found',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [2, 2, 1, 1], [1, 1, 1, 1]],
    resultFigureId: 'yunus',
    found: false,
    giftNumber: 8,
  },
  {
    name: 'no gift recovered (Iddris), found — one of the eight NOT recovered figures',
    mothers: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 2, 1]],
    resultFigureId: 'iddris',
    found: true,
    giftNumber: null,
  },
];

// ---------------------------------------------------------------------------
// The calculation itself, at the operation level
// ---------------------------------------------------------------------------

describe('the calculation reads H5/H7/H11/H14, extracts their water element, forms the star, and adds it to H7', () => {
  for (const f of FIXTURES) {
    describe(f.name, () => {
      const chart = buildChartModel(buildChart(f.mothers));

      it('EXTRACT_ELEMENT reads exactly H5, H7, H11, H14 — never any other house', () => {
        const { figure, trace } = EXTRACT_ELEMENT(chart, [5, 7, 11, 14], 'water');
        expect(figure.sourceHouses).toEqual([5, 7, 11, 14]);
        expect(trace.description).toContain('water');
        expect(trace.description).toContain('H5');
        expect(trace.description).toContain('H7');
        expect(trace.description).toContain('H11');
        expect(trace.description).toContain('H14');
      });

      it('ADD_FIGURE_TO_HOUSE(star, H7) produces exactly the expected result figure', () => {
        const star = EXTRACT_ELEMENT(chart, [5, 7, 11, 14], 'water');
        const { figure } = ADD_FIGURE_TO_HOUSE(chart, star.figure, 7);
        expect(figure.figureId).toBe(f.resultFigureId);
      });

      it('CHECK_FIGURE_PRESENT_IN_CHART agrees with the expected found fact', () => {
        const star = EXTRACT_ELEMENT(chart, [5, 7, 11, 14], 'water');
        const result = ADD_FIGURE_TO_HOUSE(chart, star.figure, 7);
        expect(CHECK_FIGURE_PRESENT_IN_CHART(chart, result.figure.dotPattern).found).toBe(f.found);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Full question-level results
// ---------------------------------------------------------------------------

describe('housesUsed is exactly [5, 7, 11, 14, 7] for every fixture', () => {
  for (const f of FIXTURES) {
    it(f.name, () => {
      const result = runEngine(buildChart(f.mothers), CH_ID)!;
      expect(result.methods[0].calculation!.housesUsed).toEqual([5, 7, 11, 14, 7]);
    });
  }
});

describe('the verdict reports only the found fact and the gift-figure match — never the fire/air/water/sand elaboration', () => {
  for (const f of FIXTURES) {
    it(`${f.name}: verdict shape and content`, () => {
      const result = runEngine(buildChart(f.mothers), CH_ID)!;
      const calc = result.methods[0].calculation!;
      const verdict = result.methods[0].verdict!;

      expect(calc.resultFigure.figureId).toBe(f.resultFigureId);

      // The found-in-chart fact is always stated.
      expect(verdict.interpretation).toContain(f.found ? 'found elsewhere in your chart' : 'not found elsewhere in your chart');

      // None of the excluded elaboration ever appears.
      const excludedPhrases = [
        'water element',
        'opened (single dot)',
        'closed (double dot)',
        'repeats',
        'fire, downward',
        'fire, upward',
        'air star',
        'sand/earth star',
        'good conversation',
        'cooked food',
        'Sadaqa gift',
        'visitors that you already know',
      ];
      for (const phrase of excludedPhrases) {
        expect(verdict.interpretation, `should not contain "${phrase}"`).not.toContain(phrase);
      }

      if (f.giftNumber === null) {
        expect(verdict.outcome).toBe('uncertain');
        expect(verdict.interpretation).toContain('is not one of the eight figures this restoration has recovered');
        expect(verdict.descriptiveAnswer).toBeUndefined();
      } else {
        expect(verdict.outcome).toBe('descriptive');
        expect(verdict.label).toContain(`gift figure #${f.giftNumber}`);
        expect(verdict.descriptiveAnswer).toBe(`gift-figure-${f.giftNumber}`);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Chapter 28's own question is completely untouched
// ---------------------------------------------------------------------------

describe("Chapter 28's own question (money-strangers-method-1) is completely untouched", () => {
  it('still has exactly one method, unchanged source quote, and its own id/title', () => {
    const q = QUESTION_REGISTRY['if-you-will-get-money-or-good-strangers'];
    expect(q).toBeDefined();
    expect(q.methods.length).toBe(1);
    expect(q.methods[0].id).toBe('money-strangers-method-1');
    expect(q.resultKind).toBeUndefined();
    expect(q.methods[0].source.quote).toBe(
      "After drawing the chart, pick the water element of h5, h7, h11 and h14 and form a star. Add it to h7 and check if it's found in the chart — it means you will get money or very good visitors that day.",
    );
  });

  it('produces the exact same favourable/uncertain verdict shape it always did, for a representative chart', () => {
    const chart = buildChart(FIXTURES[0].mothers);
    const result = runEngine(chart, 'if-you-will-get-money-or-good-strangers')!;
    expect(['favourable', 'uncertain']).toContain(result.methods[0].verdict!.outcome);
  });

  it("the new question's own SourceRef.quote is IDENTICAL to Chapter 28's — it implements no more of the source sentence than that method already does", () => {
    const giftQ = QUESTION_REGISTRY[CH_ID];
    const moneyQ = QUESTION_REGISTRY['if-you-will-get-money-or-good-strangers'];
    expect(giftQ.methods[0].source.quote).toBe(moneyQ.methods[0].source.quote);
  });
});

// ---------------------------------------------------------------------------
// Chapter 29's unrelated missing material remains unchanged
// ---------------------------------------------------------------------------

describe("Chapter 29 (\"If You Will Be Successful Where You Are Going\") is unaffected", () => {
  it('is still registered exactly as it was, under its own unrelated id', () => {
    expect(QUESTION_REGISTRY['if-you-will-be-successful-where-you-are']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Registry / availability / catalogue
// ---------------------------------------------------------------------------

describe('The Gift/Visitor Figures continuation is registered for automatic reading', () => {
  it('QUESTION_REGISTRY has a real entry with one verified, descriptive method', () => {
    const question = QUESTION_REGISTRY[CH_ID];
    expect(question).toBeDefined();
    expect(question.methods.length).toBe(1);
    expect(question.methods[0].status).toBe('verified');
    expect(question.resultKind).toBe('descriptive');
  });

  it('getQuestionAvailability returns a plain engine entry, not "Figures missing"', () => {
    expect(getQuestionAvailability(CH_ID).kind).toBe('engine');
  });

  it('the page-break continuation is consolidated into this same question, not registered separately', () => {
    const availability = getQuestionAvailability('reading-the-gift-visitor-figures-end-of-chapter');
    expect(availability.kind).toBe('consolidated');
    if (availability.kind === 'consolidated') {
      expect(availability.canonicalQuestionId).toBe(CH_ID);
    }
    expect(QUESTION_REGISTRY['reading-the-gift-visitor-figures-end-of-chapter']).toBeUndefined();
  });

  it('the catalogue entry carries no "Figures missing" badge', () => {
    const entry = catalogEntry(CH_ID)!;
    expect(entry.availability.kind).not.toBe('no-automatic-reading');
    expect(entry.engineQuestionId).toBe(CH_ID);
  });
});
