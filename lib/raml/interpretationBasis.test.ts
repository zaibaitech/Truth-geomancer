// Interpretation basis: which figure attribute a method's own rule reads.
// A LABEL on existing behaviour — these tests also pin that nothing about
// star classification or method outcomes moved when it was introduced.
import { describe, expect, it } from 'vitest';
import { buildChart } from './casting';
import { fixtureChart } from './engine/__tests__/fixtures';
import { QUESTION_REGISTRY } from './engine/questions';
import { interpretationBasisForMethod, METHOD_BASIS_LISTS } from './engine/methodBasisTable';
import { buildChartModel, runReading } from './engine';
import type { MethodDefinition, MethodCalculation } from './engine/types';
import { BASIS_LABEL, describeFigureAttributes, INTERPRETATION_BASES } from './interpretationBasis';
import { CLASSICAL_ATTRIBUTES } from '@/content/classicalAttributes';
import { getMethodVerdicts, basisForAxis } from '@/lib/server/raml/methodVerdicts';
import { getParsedMethods } from '@/lib/server/raml/methodParser';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import type { Pattern } from '@/content/stars';

const ALL_METHODS: Array<{ questionId: string; method: MethodDefinition }> = Object.values(QUESTION_REGISTRY).flatMap((q) =>
  q.methods.map((method) => ({ questionId: q.id, method })),
);

function method(id: string): MethodDefinition {
  const found = ALL_METHODS.find((m) => m.method.id === id);
  if (!found) throw new Error(`no method ${id}`);
  return found.method;
}

const MODEL = buildChartModel(fixtureChart());

/** A real calculation for the method, with the result figure's qualities
 * overridden — to ask "what does this method's own rule say if the figure
 * were X?" without touching the rule. */
function calcWith(m: MethodDefinition, over: { fortune?: 'good' | 'bad' | 'middleGood'; element?: 'fire' | 'air' | 'water' | 'sand' }): MethodCalculation {
  const calc = m.calculate(buildChartModel(fixtureChart()));
  const fig = calc.resultFigure;
  return {
    ...calc,
    resultFigure: {
      ...fig,
      element: over.element ?? fig.element,
      qualities: {
        ...fig.qualities,
        fortune: over.fortune ? { status: 'verified', value: over.fortune } : fig.qualities.fortune,
      },
    } as typeof fig,
  };
}

describe('interpretationBasis — engine method table', () => {
  it('uses exactly the three allowed values', () => {
    expect([...INTERPRETATION_BASES]).toEqual(['star_quality', 'element', 'source_specific']);
  });

  it('labels every hand-authored method exactly once', () => {
    const listed = [...METHOD_BASIS_LISTS.STAR_QUALITY_METHODS, ...METHOD_BASIS_LISTS.ELEMENT_METHODS, ...METHOD_BASIS_LISTS.SOURCE_SPECIFIC_METHODS];
    expect(new Set(listed).size).toBe(listed.length);
    expect(new Set(listed)).toEqual(new Set(ALL_METHODS.map((m) => m.method.id)));
    for (const { method: m } of ALL_METHODS) expect(interpretationBasisForMethod(m.id)).not.toBeNull();
    expect(interpretationBasisForMethod('no-such-method')).toBeNull();
  });

  it('stays consistent with what each method’s own evaluate rule reads', () => {
    const FORTUNE = /fortune|middleGood|COUNT_FORTUNE/;
    const ELEMENT = /CHECK_ELEMENT|COUNT_ELEMENTS|EXTRACT_ELEMENT|\.element\b|CHECK_LINE_STATE|fireOrWater|'(water|fire|air|sand)'/;
    for (const { method: m } of ALL_METHODS) {
      const src = m.evaluate.toString();
      const f = FORTUNE.test(src);
      const e = ELEMENT.test(src);
      const expected = f && !e ? 'star_quality' : e && !f ? 'element' : 'source_specific';
      expect(interpretationBasisForMethod(m.id), m.id).toBe(expected);
    }
  });

  it('every composed reading row and indicator carries the basis of its method', () => {
    const reading = runReading(fixtureChart(), 'business-profit-and-loss');
    expect(reading).not.toBeNull();
    for (const row of reading!.methodResults) expect(row.interpretationBasis, row.id).toBe(interpretationBasisForMethod(row.id));
    expect(reading!.primaryFigure?.interpretationBasis).toBe('star_quality');
  });
});

describe('interpretationBasis — outcomes follow each method’s own rule', () => {
  it('star_quality: a good star is favourable and a bad star unfavourable', () => {
    const m = method('business-method-1');
    expect(interpretationBasisForMethod(m.id)).toBe('star_quality');
    expect(m.evaluate(calcWith(m, { fortune: 'good' }), MODEL).outcome).toBe('favourable');
    expect(m.evaluate(calcWith(m, { fortune: 'bad' }), MODEL).outcome).toBe('unfavourable');
  });

  it('star_quality: a middle-good star is NOT silently treated as fully favourable', () => {
    const m = method('business-method-1');
    const verdict = m.evaluate(calcWith(m, { fortune: 'middleGood' }), MODEL);
    expect(verdict.outcome).not.toBe('favourable');
    expect(verdict.outcome).toBe('uncertain');
  });

  it('element: a bad star does not make an element method negative (and a good one does not make it positive)', () => {
    const m = method('success-at-home-method-2');
    expect(interpretationBasisForMethod(m.id)).toBe('element');
    // The method’s own quoted rule: water/sand -> stay, fire/air -> run.
    expect(m.evaluate(calcWith(m, { element: 'water', fortune: 'bad' }), MODEL).outcome).toBe('favourable');
    expect(m.evaluate(calcWith(m, { element: 'sand', fortune: 'bad' }), MODEL).outcome).toBe('favourable');
    expect(m.evaluate(calcWith(m, { element: 'fire', fortune: 'good' }), MODEL).outcome).toBe('unfavourable');
    expect(m.evaluate(calcWith(m, { element: 'air', fortune: 'good' }), MODEL).outcome).toBe('unfavourable');
  });

  it('element rules are method-specific: the same element can be read oppositely by another method (no universal ranking)', () => {
    const home = method('success-at-home-method-2'); // water/sand = stay (favourable)
    const travel = method('travel-method-2');
    expect(interpretationBasisForMethod(travel.id)).toBe('element');
    const homeWater = home.evaluate(calcWith(home, { element: 'water' }), MODEL).outcome;
    const travelWater = travel.evaluate(calcWith(travel, { element: 'water' }), MODEL).outcome;
    const homeFire = home.evaluate(calcWith(home, { element: 'fire' }), MODEL).outcome;
    const travelFire = travel.evaluate(calcWith(travel, { element: 'fire' }), MODEL).outcome;
    expect([homeWater, homeFire]).not.toEqual([travelWater, travelFire]);
  });

  it('source_specific: the outcome is independent of the figure’s global good/bad quality', () => {
    const sourceSpecific = ALL_METHODS.filter(({ method: m }) => interpretationBasisForMethod(m.id) === 'source_specific');
    expect(sourceSpecific.length).toBeGreaterThan(0);
    const dependsOnQuality: string[] = [];
    let checked = 0;
    for (const { method: m } of sourceSpecific) {
      let verdicts: string[];
      try {
        verdicts = (['good', 'bad', 'middleGood'] as const).map((fortune) => m.evaluate(calcWith(m, { fortune }), MODEL).outcome);
      } catch {
        continue; // methods deliberately left uncomputed (source figures not transcribed)
      }
      checked++;
      if (new Set(verdicts).size !== 1) dependsOnQuality.push(m.id);
    }
    // The only source-specific methods whose own rule combines quality WITH
    // another attribute (a compound rule — hence labelled the method's own
    // rule rather than star quality or element). Pinned so a new one is a
    // deliberate, reviewed addition.
    expect(dependsOnQuality.sort()).toEqual(['children-method-5', 'yearly-news-method-1']);
    expect(checked).toBeGreaterThan(50);
  });
});

describe('interpretationBasis — Kanzul text-parsed pipeline', () => {
  const chart = fixtureChart();

  it('derives the basis from the existing Axis, with no new global rule', () => {
    expect(basisForAxis({ kind: 'fortune' })).toBe('star_quality');
    expect(basisForAxis({ kind: 'fortuneUpdown' })).toBe('star_quality');
    expect(basisForAxis({ kind: 'element' })).toBe('element');
    expect(basisForAxis({ kind: 'elementOpenedClosed', element: 'water' })).toBe('element');
    for (const kind of ['updown', 'foundInChart', 'fortuneFoundInChart', 'updownFoundInChart', 'namedStar'] as const) {
      expect(basisForAxis({ kind }), kind).toBe('source_specific');
    }
  });

  it('every computed verdict carries a valid basis matching its parsed method’s axis', () => {
    let seen = 0;
    for (const { id: chapterId } of KM_CHAPTERS) {
      const verdicts = getMethodVerdicts(chapterId, chart);
      if (!verdicts) continue;
      const parsed = getParsedMethods(chapterId);
      verdicts.forEach((v, i) => {
        if (!v) return;
        expect(INTERPRETATION_BASES).toContain(v.interpretationBasis);
        const pm = parsed[i];
        if (pm) expect(v.interpretationBasis, `${chapterId} ${v.label}`).toBe(basisForAxis(pm.axis));
        seen++;
      });
    }
    expect(seen).toBeGreaterThan(50);
  });

  it('the hand-authored stay chapter keeps its rules: Method 1 reads up/down only, Method 2 reads star quality', () => {
    const [m1, m2] = getMethodVerdicts('if-she-s-going-to-stay-in-the', chart)!;
    expect(m1!.interpretationBasis).toBe('source_specific');
    expect(m2!.interpretationBasis).toBe('star_quality');
    // Method 1's wording is unchanged: upward -> will not stay, downward -> will stay.
    const samples: Array<[Pattern, Pattern, Pattern, Pattern]> = [
      [[1, 1, 2, 1], [1, 2, 2, 2], [2, 1, 1, 1], [2, 2, 1, 2]],
      [[2, 2, 2, 2], [1, 1, 1, 1], [2, 1, 1, 2], [1, 2, 1, 2]],
      [[1, 2, 1, 1], [2, 1, 2, 1], [2, 2, 1, 1], [1, 1, 1, 2]],
    ];
    for (const mothers of samples) {
      const verdict = getMethodVerdicts('if-she-s-going-to-stay-in-the', buildChart(mothers))![0]!;
      if (verdict.result.upDown === 'upward') expect(verdict.interpretation).toBe('She will not stay forever.');
      else if (verdict.result.upDown === 'downward') expect(verdict.interpretation).toBe("She will stay, Insha'Allah.");
      else expect(verdict.ambiguous).toBe(true);
    }
  });
});

describe('describeFigureAttributes — what the UI may present as deciding', () => {
  const facts = { fortune: 'Bad', direction: 'Upward', element: 'Fire' };

  it('star_quality: the good/bad word is the deciding fact', () => {
    const d = describeFigureAttributes('star_quality', facts);
    expect(d.basisLabel).toBe(BASIS_LABEL.star_quality);
    expect(d.deciding).toEqual(['Bad']);
    expect(d.other).toEqual(['Upward', 'Fire']);
  });

  it('element: the global good/bad word is never shown as, or beside, the verdict', () => {
    const d = describeFigureAttributes('element', facts);
    expect(d.deciding).toEqual(['Fire']);
    expect([...d.deciding, ...d.other]).not.toContain('Bad');
  });

  it('source_specific: nothing is presented as having decided it, and no good/bad word appears', () => {
    const d = describeFigureAttributes('source_specific', facts);
    expect(d.basisLabel).toBe(BASIS_LABEL.source_specific);
    expect(d.deciding).toEqual([]);
    expect(d.other).not.toContain('Bad');
  });

  it('unknown basis keeps the long-standing display of every fact', () => {
    const d = describeFigureAttributes(null, facts);
    expect(d.basisLabel).toBeNull();
    expect(d.other).toEqual(['Bad', 'Upward', 'Fire']);
  });

  it('omits unknown facts instead of printing blanks', () => {
    expect(describeFigureAttributes('element', { fortune: null, direction: null, element: null })).toEqual({
      basisLabel: BASIS_LABEL.element,
      deciding: [],
      other: [],
    });
  });
});

describe('star classifications are unchanged by this phase', () => {
  it('pins the full classical table; Yunus is neutral (source-confirmed middle-good), every other figure is unchanged', () => {
    const table = Object.fromEntries(Object.entries(CLASSICAL_ATTRIBUTES).map(([id, a]) => [id, `${a.fortune}/${a.upDown}`]));
    expect(table).toEqual({
      yussif: 'bad/level',
      adam: 'good/upward',
      mahadi: 'good/downward',
      iddris: 'good/level',
      ibrahim: 'neutral/level',
      issah: 'bad/upward',
      umar: 'bad/level',
      ayuba: 'bad/downward',
      'kalla-allahu': 'good/upward',
      sulemana: 'bad/level',
      ali: 'neutral/level',
      nuhu: 'good/downward',
      'hassan-hussein': 'bad/upward',
      yunus: 'neutral/level', // source-confirmed middle-good
      usman: 'good/downward',
      musah: 'neutral/level',
    });
    expect(Object.keys(CLASSICAL_ATTRIBUTES)).toHaveLength(16);
  });
});
