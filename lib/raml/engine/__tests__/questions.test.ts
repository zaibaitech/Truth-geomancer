import { describe, expect, it } from 'vitest';
import { runEngine } from '../index';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();

describe('runEngine — no manual house selection required', () => {
  it('accepts only a chart and an intention id, nothing house-shaped', () => {
    // If this compiles and runs with exactly two arguments, no caller can
    // be asked to supply a house number — the type signature itself is the
    // guarantee this test is checking.
    const result = runEngine(chart, 'if-you-want-to-know-if-you-will');
    expect(result).not.toBeNull();
  });

  it('returns null for an intention not yet in the pilot registry, so callers can fall back cleanly', () => {
    expect(runEngine(chart, 'some-unrelated-intention-id')).toBeNull();
  });
});

describe('Money question (Kanzul Mikban ch.2)', () => {
  const result = runEngine(chart, 'if-you-want-to-know-if-you-will')!;

  it('computes Method 1 correctly: H3+H7+H11+H15 = Yussif, fire line opened -> favourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'money-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.calculation!.housesUsed).toEqual([3, 7, 11, 15]);
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('computes Method 2 correctly: (H2+H11)+H7 = Yussif, found in chart -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'money-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('computes Method 3 (element extraction) correctly: water-line of H3/H7/H11/H15 = Ibrahim -> favourable', () => {
    const m3 = result.methods.find((m) => m.method.id === 'money-method-3')!;
    expect(m3.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m3.verdict!.outcome).toBe('favourable');
  });

  it("marks Method 4 (Sirri Sa'ael) uncertain and excludes it from calculation", () => {
    const m4 = result.methods.find((m) => m.method.id === 'money-method-4')!;
    expect(m4.method.status).toBe('uncertain');
    expect(m4.calculation).toBeNull();
    expect(m4.verdict).toBeNull();
  });

  it('reaches full agreement across the 3 computable methods and reports it', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.calculationDetails.consensus.verifiableCount).toBe(3);
    expect(result.overallResult).toBe('favourable');
  });

  it('surfaces every house any method touched as a supporting house', () => {
    expect(result.supportingHouses).toEqual(expect.arrayContaining([2, 3, 7, 11, 15]));
  });
});

describe('Business question (Kanzul Mikban ch.3)', () => {
  const result = runEngine(chart, 'business-profit-and-loss')!;

  it('computes Method 1 correctly: H1+H5+H4+H6 = Sulemana, bad -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'business-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('sulemana');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('computes Method 2 correctly and reports uncertain for a middle-good result the method itself never addresses', () => {
    const m2 = result.methods.find((m) => m.method.id === 'business-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ali');
    expect(m2.calculation!.resultFigure.qualities.fortune.value).toBe('middleGood');
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('keeps Method 3 as needs_review but still shows its calculation (H2 vs H6)', () => {
    const m3 = result.methods.find((m) => m.method.id === 'business-method-3')!;
    expect(m3.method.status).toBe('needs_review');
    expect(m3.calculation).not.toBeNull();
    expect(m3.calculation!.housesUsed).toEqual([2, 6]);
    expect(m3.verdict).toBeNull(); // no verdict from an unverified method
  });
});

describe('Court case / fight / war question (Kanzul Mikban ch.19)', () => {
  const result = runEngine(chart, 'if-you-will-win-a-case-in-court')!;

  it('computes Method 1 correctly: H1+H5+H9+H14 = Yunus, good -> favourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'court-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('yunus');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('computes Method 2 correctly: (H8+H11+H7+H16)+H1 = Musah, middle-good -> mixed', () => {
    const m2 = result.methods.find((m) => m.method.id === 'court-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('musah');
    expect(m2.verdict!.outcome).toBe('mixed');
  });

  it('marks Method 3 uncertain (named figures omitted from the source)', () => {
    const m3 = result.methods.find((m) => m.method.id === 'court-method-3')!;
    expect(m3.method.status).toBe('uncertain');
    expect(m3.calculation).toBeNull();
  });

  it('computes Method 4 correctly: H8+H1+H9+H11 = Umar, bad -> unfavourable', () => {
    const m4 = result.methods.find((m) => m.method.id === 'court-method-4')!;
    expect(m4.calculation!.resultFigure.figureId).toBe('umar');
    expect(m4.verdict!.outcome).toBe('unfavourable');
  });

  it('correctly reports a genuine conflict — one favourable, one mixed, one unfavourable', () => {
    const c = result.calculationDetails.consensus;
    expect(c.favourableCount).toBe(1);
    expect(c.mixedCount).toBe(1);
    expect(c.unfavourableCount).toBe(1);
    expect(c.level).toBe('conflict');
    expect(result.overallResult).toBe('mixed');
  });
});

describe('Stolen/lost things question (Kanzul Mikban ch.18, Part B)', () => {
  // Prompt 6 audit superseded the Method 3 + consensus assertions below:
  // the source text names TWO independent rules for the same h2+h6+h9+h16
  // calculation (the book's own primary "found in the chart" rule, and a
  // second, explicitly-attributed "Some scholars also say..." rule with a
  // fortune x direction breakdown) — the earlier version of this file
  // folded the scholars' rule into cosmetic elaboration text on Method 3's
  // own verdict instead of counting it as its own method. Split into
  // Method 3 (primary rule only) and Method 4 (the scholars' rule,
  // independently counted) — see stolenThings.ts's own header comment.
  const result = runEngine(chart, 'if-you-will-get-your-stolen-things-back')!;

  it('computes Method 1 correctly: H1+H5 = Ayuba, not found in chart -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'stolen-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it("computes Method 2 correctly and reports uncertain for a 'level' direction", () => {
    const m2 = result.methods.find((m) => m.method.id === 'stolen-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('sulemana');
    expect(m2.calculation!.resultFigure.qualities.direction.value).toBeNull();
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('computes Method 3 correctly: H2+H6+H9+H16 = Usman, found in the chart -> favourable (primary rule only, no elaboration)', () => {
    const m3 = result.methods.find((m) => m.method.id === 'stolen-method-3')!;
    expect(m3.calculation!.resultFigure.figureId).toBe('usman');
    expect(m3.verdict!.outcome).toBe('favourable');
    expect(m3.verdict!.interpretation).toBe('You will get them.');
  });

  it('computes Method 4 correctly: the same H2+H6+H9+H16 = Usman, good and downward -> favourable, "peacefully" (the scholars\' own rule)', () => {
    const m4 = result.methods.find((m) => m.method.id === 'stolen-method-4')!;
    expect(m4.calculation!.resultFigure.figureId).toBe('usman');
    expect(m4.calculation!.resultFigure.qualities.fortune.value).toBe('good');
    expect(m4.calculation!.resultFigure.qualities.direction.value).toBe('downward');
    expect(m4.verdict!.outcome).toBe('favourable');
    expect(m4.verdict!.interpretation).toContain('peacefully');
  });

  it('Methods 3 and 4 independently agree favourable; only Method 1 dissents -> mostly_agree, not a 1-vs-1 conflict', () => {
    const c = result.calculationDetails.consensus;
    expect(c.favourableCount).toBe(2);
    expect(c.unfavourableCount).toBe(1);
    expect(c.verifiableCount).toBe(3);
    expect(c.level).toBe('mostly_agree');
  });
});

describe('Travel/return safety question (Kanzul Mikban ch.1)', () => {
  const result = runEngine(chart, 'traveling-business-and-if-you-will-return-from')!;

  it('computes Method 1 correctly: H1+H8+H9+H11 = Umar, bad -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'travel-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('umar');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('computes Method 2 correctly: H1+H7+H4+H8 = Ali (air) -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'travel-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ali');
    expect(m2.calculation!.resultFigure.element).toBe('air');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('runs the Method 3 element-extraction calculation (needs_review) without throwing, and withholds a verdict', () => {
    const m3 = result.methods.find((m) => m.method.id === 'travel-method-3')!;
    expect(m3.method.status).toBe('needs_review');
    expect(m3.calculation).not.toBeNull();
    expect(m3.calculation!.resultFigure.figureId).toBe('adam'); // hand-verified sum of the 4 extracted figures
    expect(m3.verdict).toBeNull();
  });

  it('reports a conflict between Method 1 (unfavourable) and Method 2 (favourable)', () => {
    const c = result.calculationDetails.consensus;
    expect(c.level).toBe('conflict');
  });
});
