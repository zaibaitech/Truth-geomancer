// Stage 6 of the engine's question coverage — Prompt 9, Kanzul Mikban
// chapters 81-100 (chapter 95 not registered — a reference table, entirely
// omitted; the "if-a-sick-person-has-long-life-repeated" fragment merged
// into ch.96's own question as its Method 2 — see COVERAGE.md). Same
// fixture chart as the rest of the suite; every expected figure/outcome
// below was read straight off a printed audit run of runEngine/runReading
// against this exact chart before being relied on here — not guessed.
import { describe, expect, it } from 'vitest';
import { runEngine, runReading } from '../index';
import { QUESTION_REGISTRY } from '../questions';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();

describe('If she will put to bed peacefully (ch.81)', () => {
  const result = runEngine(chart, 'if-she-will-put-to-bed-peacefully-or')!;

  it('H5 = Kalla Allahu, good and upward -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('good');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('The time she will put to bed (ch.82) — descriptive', () => {
  const result = runEngine(chart, 'the-time-she-will-put-to-bed')!;

  it('Method 1: H1+H5 = Ayuba, sand element -> descriptive "more than 1-2 months"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'time-to-put-to-bed-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.calculation!.resultFigure.element).toBe('sand');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('more-than-a-month');
  });

  it('Method 2: the source is cut off mid-sentence -> uncertain, never produces a verdict', () => {
    const m2 = result.methods.find((m) => m.method.id === 'time-to-put-to-bed-method-2')!;
    expect(m2.method.status).toBe('uncertain');
    expect(m2.verdict).toBeNull();
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'the-time-she-will-put-to-bed')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('More than 1-2 months');
  });
});

describe('If it\'s day or night that she will put to bed (ch.83) — day/night axis unsourced', () => {
  const result = runEngine(chart, 'if-it-s-day-or-night-that-she')!;

  it('Method 1: H1+H5 = Ayuba computed, but day/night classification is unsourced -> needs_review, excluded', () => {
    const m1 = result.methods.find((m) => m.method.id === 'day-or-night-birth-method-1')!;
    expect(m1.method.status).toBe('needs_review');
    const def = QUESTION_REGISTRY['if-it-s-day-or-night-that-she'].methods[0];
    expect(def.reviewReasonCode).toBe('day_night_classification_unsourced');
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.verdict).toBeNull();
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
    const reading = runReading(chart, 'if-it-s-day-or-night-that-she')!;
    expect(reading.isInsufficient).toBe(true);
  });
});

describe('If your enemy is from your family (ch.84) — descriptive, positive-trigger-only', () => {
  const result = runEngine(chart, 'if-your-enemy-is-from-your-father-s')!;

  it('all three houses (H3=Mahadi, H4=Iddris, H5=Kalla Allahu) are good, not bad -> all three uncertain', () => {
    result.methods.forEach((m) => {
      expect(m.verdict!.outcome).toBe('uncertain');
    });
    expect(result.methods[0].calculation!.resultFigure.figureId).toBe('mahadi');
    expect(result.methods[1].calculation!.resultFigure.figureId).toBe('iddris');
    expect(result.methods[2].calculation!.resultFigure.figureId).toBe('kalla-allahu');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('How the future of two people\'s friendship will be (ch.85) — direction + stability split', () => {
  const result = runEngine(chart, 'how-the-future-of-two-people-s-friendship')!;

  it('Method 1 (direction): H1+H11 = Yunus, good but level (no direction) -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'friendship-future-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('yunus');
    expect(m1.calculation!.resultFigure.qualities.direction.value).toBeNull();
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2 (stability): blocked by the unsourced stability axis -> needs_review, excluded', () => {
    const m2 = result.methods.find((m) => m.method.id === 'friendship-future-method-2')!;
    expect(m2.method.status).toBe('needs_review');
    const def = QUESTION_REGISTRY['how-the-future-of-two-people-s-friendship'].methods.find((m) => m.id === 'friendship-future-method-2')!;
    expect(def.reviewReasonCode).toBe('stability_classification_unsourced');
    expect(m2.verdict).toBeNull();
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Secrets between two friends (unnumbered fragment after ch.85) — descriptive', () => {
  const result = runEngine(chart, 'secrets-between-two-friends-who-follow-each-other')!;

  it('H4=Iddris (good), H15=Ibrahim (middle-good) — not both good -> uncertain, not assumed "secrets come out"', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m1.verdict!.label).toBe('Not both good');
  });

  it('no method counts -> insufficient data, honestly (not silently resolved to "secrets come out")', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Is it business or handwork that will benefit me (ch.86) — direction + stability split', () => {
  const result = runEngine(chart, 'if-it-s-business-or-handwork-that-will')!;

  it('Method 1 (direction): H2+H10 = Yussif, bad but level (no direction) -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'business-or-handwork-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.calculation!.resultFigure.qualities.direction.value).toBeNull();
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2 (stability): blocked by the unsourced stability axis -> needs_review, excluded', () => {
    const m2 = result.methods.find((m) => m.method.id === 'business-or-handwork-method-2')!;
    expect(m2.method.status).toBe('needs_review');
    const def = QUESTION_REGISTRY['if-it-s-business-or-handwork-that-will'].methods.find((m) => m.id === 'business-or-handwork-method-2')!;
    expect(def.reviewReasonCode).toBe('stability_classification_unsourced');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('When your suffering will end (ch.87)', () => {
  const result = runEngine(chart, 'when-your-suffering-and-pain-or-sadness-will')!;

  it('H6+H12 = Nuhu, good and downward -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('If you will get a position or rank (ch.88)', () => {
  const result = runEngine(chart, 'if-you-will-get-a-position-rank-or')!;

  it('opened lines across H1,H2,H4,H5,H10,H11,H15 = 15, minus 12 = 3 -> H3 = Mahadi, good -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('mahadi');
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.label).toBe('H3, good star');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('If your success or wealth will remain forever (ch.89)', () => {
  const result = runEngine(chart, 'if-your-success-or-wealth-will-remain-forever')!;

  it('same 7-house opened-line count (15), cast out by 12s -> 3 -> H3 = Mahadi, good -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('mahadi');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('If someone\'s misery will be taken away (ch.90)', () => {
  const result = runEngine(chart, 'if-someone-s-misery-will-be-taken-away')!;

  it('Method 1: calculation shown (H11 = Ali) but the source never states what the result means -> uncertain, no verdict', () => {
    const m1 = result.methods.find((m) => m.method.id === 'misery-taken-away-method-1')!;
    expect(m1.method.status).toBe('uncertain');
    const def = QUESTION_REGISTRY['if-someone-s-misery-will-be-taken-away'].methods.find((m) => m.id === 'misery-taken-away-method-1')!;
    expect(def.reviewReasonCode).toBe('interpretation_not_stated');
    expect(m1.calculation!.resultFigure.figureId).toBe('ali');
    expect(m1.verdict).toBeNull();
  });

  it('Method 2: 8 good houses vs. 4 bad -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'misery-taken-away-method-2')!;
    expect(m2.verdict!.outcome).toBe('favourable');
    expect(m2.verdict!.label).toBe('8 good vs. 4 bad');
  });

  it('only Method 2 counts -> favourable', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('If something is present, past, or future (ch.91) — temporal axis unsourced', () => {
  const result = runEngine(chart, 'if-something-is-present-past-or-future')!;

  it('Method 1: calculation runs but the present/past/future classification is unsourced -> needs_review, excluded', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('needs_review');
    const def = QUESTION_REGISTRY['if-something-is-present-past-or-future'].methods[0];
    expect(def.reviewReasonCode).toBe('temporal_classification_unsourced');
    expect(m1.verdict).toBeNull();
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('The ending part of anything you want to do (ch.92)', () => {
  const result = runEngine(chart, 'the-ending-part-of-anything-you-want-to')!;

  it('only 1 of H4/H14/H15 is good -> unfavourable (full binary coverage)', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.label).toBe('1 of 3 good');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('If someone has long life or not (ch.93)', () => {
  const result = runEngine(chart, 'if-someone-has-long-life-or-not')!;

  it('H1+H9 = Adam, found among H1-H4 (mothers) -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('adam');
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.label).toBe('Found among H1-H4');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('The lifespan and when someone will die (ch.94) — figures omitted', () => {
  const result = runEngine(chart, 'the-lifespan-and-when-someone-will-die')!;

  it('H8 = Issah shown, but the branch-trigger figures are omitted -> uncertain, no verdict', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('uncertain');
    expect(m1.calculation!.resultFigure.figureId).toBe('issah');
    expect(m1.verdict).toBeNull();
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('If a sick person has long life (ch.96) — a genuine conflict, not averaged', () => {
  const result = runEngine(chart, 'if-a-sick-person-has-long-life-or')!;

  it('Method 1: H1+H9 = Adam, air line closed -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'sick-person-long-life-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('adam');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2 (from the "repeated" fragment): quartet water-elements sum to Ayuba, water line closed -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'sick-person-long-life-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('a genuine conflict between the two methods is preserved as "mixed", not averaged', () => {
    expect(result.calculationDetails.consensus.level).toBe('conflict');
    expect(result.overallResult).toBe('mixed');
  });
});

describe('Where one will die (ch.97) — figures omitted', () => {
  const result = runEngine(chart, 'where-one-will-die-place-of-death')!;

  it('H8 = Issah shown, but the branch-trigger figures are omitted -> uncertain, no verdict', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('uncertain');
    expect(m1.calculation!.resultFigure.figureId).toBe('issah');
    expect(m1.verdict).toBeNull();
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('The causes of someone\'s death (ch.98) — descriptive', () => {
  const result = runEngine(chart, 'the-causes-of-someone-s-death')!;

  it('H8 = Issah, repeats exactly once (at H6) -> descriptive "slavery or friendship"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('issah');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('slavery-or-friendship');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'the-causes-of-someone-s-death')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Slavery or friendship');
  });
});

describe('If something good will come to you today (ch.99)', () => {
  const result = runEngine(chart, 'if-someone-or-something-good-will-come-to')!;

  it('H1+H7 = Hassan-Hussein, bad -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('If today is a good day (ch.100)', () => {
  const result = runEngine(chart, 'if-today-is-a-good-day-or-not')!;

  it('H2+H8 = Iddris, good -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});
