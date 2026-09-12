// Stage 9 of the engine's question coverage — Prompt 12, Kanzul Mikban
// chapters 141-150 (chapter 151, "Dreams and Their Interpretations," is not
// registered — see COVERAGE.md; the manuscript's own highest chapter
// number is 151, so nothing exists beyond this stage to extract). Same
// fixture chart as the rest of the suite; every expected figure/outcome
// below was read straight off a printed audit run of runEngine/runReading
// against this exact chart before being relied on here — not guessed.
// Several sums were additionally hand-verified via independent addPatterns
// arithmetic (e.g. ch.145's H1+H10+H11+H13 resolving through Adam and
// hassan-hussein, with Musah acting as an identity element for the final
// addition since [2,2,2,2] leaves every other line's parity unchanged).
import { describe, expect, it } from 'vitest';
import { runEngine, runReading } from '../index';
import { QUESTION_REGISTRY } from '../questions';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();

describe('Is the prisoner male or female (ch.141) — gender classification investigation', () => {
  const result = runEngine(chart, 'if-the-prisoner-is-male-or-female')!;

  it('H1+H7 = hassan-hussein, but the method is blocked on the unsourced gender classification', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m1.method.status).toBe('needs_review');
    expect(m1.verdict).toBeNull();
    const def = QUESTION_REGISTRY['if-the-prisoner-is-male-or-female'].methods[0];
    expect(def.reviewReasonCode).toBe('gender_classification_unsourced');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Where are the kidnappers (ch.142) — calculation and trigger figures both unrecoverable', () => {
  const result = runEngine(chart, 'where-kidnappers-are-keeping-a-person-hostage')!;

  it('Method 1: uncertain, excluded', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('uncertain');
    expect(m1.verdict).toBeNull();
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('The consequence of a prisoner (ch.143) — both methods agree unfavourable', () => {
  const result = runEngine(chart, 'the-consequence-of-a-prisoner')!;

  it('Method 1: H1+H6+H12+H15 = ayuba, bad -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'prisoner-consequence-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H3+H12+H1+H4 = ayuba (same result), bad -> unfavourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'prisoner-consequence-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('both methods agree -> a real unfavourable result', () => {
    expect(result.overallResult).toBe('unfavourable');
    expect(result.calculationDetails.consensus.level).toBe('agree');
  });
});

describe('Will I get my debts/deposit back (ch.144) — good and repeats in the chart', () => {
  const result = runEngine(chart, 'if-you-will-get-your-debts-deposit-or')!;

  it('H1+H7+H2+H8 = kalla-allahu, good, and repeats at H5 itself -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.label).toBe('Good and repeats in the chart');
  });

  it('resolves as a real favourable result', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('Will I get a position or chieftaincy title (ch.145) — bad', () => {
  const result = runEngine(chart, 'if-someone-will-get-a-particular-position-or')!;

  it('H1+H10+H11+H13 = hassan-hussein (Musah acts as identity), bad -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });
});

describe('Will I own a house in my life (ch.146) — middle-good', () => {
  const result = runEngine(chart, 'if-you-will-own-a-house-in-your')!;

  it('H1+H4+H11+H15 = Ali, middle-good -> mixed', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ali');
    expect(m1.verdict!.outcome).toBe('mixed');
  });

  it('resolves as a real mixed result', () => {
    expect(result.overallResult).toBe('mixed');
  });
});

describe('Is this apartment safe for me (ch.147) — good', () => {
  const result = runEngine(chart, 'if-this-apartment-you-are-going-to-is')!;

  it('H1+H4+H5 = Nuhu, good -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('resolves as a real favourable result', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('Will I receive the expected message (ch.148) — bad', () => {
  const result = runEngine(chart, 'if-you-will-receive-the-expected-message')!;

  it('H1+H5+H15 = hassan-hussein, bad -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });
});

describe('Which day will the pregnant woman put to bed (ch.149) — day 4-7, unconfirmed', () => {
  const result = runEngine(chart, 'which-day-a-pregnant-woman-will-put-to')!;

  it('28 dots (H1/H4/H5/H7/H15), cast out by 7s = 7 -> uncertain (days 4-7 not legible in the transcription)', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m1.verdict!.label).toBe('Result 7 (day 4-7)');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Will I get back to work after this problem (ch.150) — good', () => {
  const result = runEngine(chart, 'if-you-will-get-back-to-work-after')!;

  it('H1+H6+H10 = Iddris, good -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('resolves as a real favourable result', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('Chapter 151 ("Dreams and Their Interpretations") is not registered', () => {
  it('has no QuestionDefinition — ambiguous "pair them" calculation plus all 16 branch triggers omitted', () => {
    expect(QUESTION_REGISTRY['dreams-and-their-interpretations']).toBeUndefined();
  });
});
