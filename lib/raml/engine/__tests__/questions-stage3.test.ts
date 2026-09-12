// Stage 3 of the engine's question coverage — Prompt 4, Kanzul Mikban
// chapters 20-40 (chapter 33 not registered: see COVERAGE.md). Same
// fixture chart as the rest of the suite; every expected figure/outcome
// below was read straight off a printed audit run of runEngine/runReading
// against this exact chart before being relied on here — not guessed.
import { describe, expect, it } from 'vitest';
import { runEngine, runReading } from '../index';
import { fixtureChart } from './fixtures';
import type { Pattern } from '@/content/stars';

const chart = fixtureChart();

describe('Election or chieftaincy (ch.20)', () => {
  const result = runEngine(chart, 'who-will-win-an-election-or-a-chieftaincy')!;

  it('Method 1: H1+H5+H9+H13 = Umar, bad -> unfavourable, with a not-found delay note', () => {
    const m1 = result.methods.find((m) => m.method.id === 'election-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('umar');
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.interpretation).toContain('delayed');
  });

  it('Method 2: H10+H12+H14+H15 = Kalla Allahu, good -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'election-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('a genuine conflict between the two methods is preserved as "mixed", not averaged', () => {
    expect(result.calculationDetails.consensus.level).toBe('conflict');
    expect(result.overallResult).toBe('mixed');
  });

  it('ReadingResult: shows the conflict honestly, with both methods counted', () => {
    const reading = runReading(chart, 'who-will-win-an-election-or-a-chieftaincy')!;
    expect(reading.conflictingIndicators).toBe(true);
    expect(reading.methodResults.filter((m) => m.counted)).toHaveLength(2);
  });
});

describe('Wife/sister had sex (ch.21)', () => {
  // Prompt 6 audit superseded these assertions: this question predates the
  // `resultKind: 'descriptive'` model (Prompt 4.5, one stage after this
  // file was written) and was never migrated, leaving it inconsistent with
  // chapter 58's structurally identical "if couples have had sex" question.
  // Whether sex occurred is a factual yes/no answer — the source attaches
  // no favourable/unfavourable value judgment to either branch — so Method
  // 2 now correctly reports `outcome: 'descriptive'` / `descriptiveAnswer:
  // 'yes'`, matching couplesHadSex.ts exactly. The underlying calculation
  // (H7+H13, water line state) is completely unchanged.
  const result = runEngine(chart, 'if-your-wife-or-sister-has-had-sex')!;

  it('Method 1: needs_review — computes the figure but withholds the whole-figure opened/closed verdict', () => {
    const m1 = result.methods.find((m) => m.method.id === 'wife-sex-method-1')!;
    expect(m1.method.status).toBe('needs_review');
    expect(m1.calculation).not.toBeNull();
    expect(m1.verdict).toBeNull();
  });

  it('Method 2: H7+H13 = Nuhu, water line opened -> a real descriptive "yes"', () => {
    const m2 = result.methods.find((m) => m.method.id === 'wife-sex-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m2.calculation!.resultFigure.qualities.lineStates.water).toBe('opened');
    expect(m2.verdict!.outcome).toBe('descriptive');
    expect(m2.verdict!.descriptiveAnswer).toBe('yes');
  });

  it('Method 3: uncertain — depends on omitted named figures', () => {
    const m3 = result.methods.find((m) => m.method.id === 'wife-sex-method-3')!;
    expect(m3.method.status).toBe('uncertain');
    expect(m3.calculation).toBeNull();
  });

  it('only the one verified, computable method counts toward the reading, as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.kind).toBe('descriptive');
    expect(result.calculationDetails.consensus.verifiableCount).toBe(1);
    const reading = runReading(chart, 'if-your-wife-or-sister-has-had-sex')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.isInsufficient).toBe(false);
  });
});

describe('Good to stay in a house (sub-chapter between 21 and 22)', () => {
  const result = runEngine(chart, 'if-it-s-good-to-stay-in-a')!;

  it('Method 1: sand-extract of H4/H8/H14/H16 = Iddris, good -> favourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'stay-house-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('Method 2: H8+H9+H2+H6 = Yussif, bad -> unfavourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'stay-house-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 3: whole-chart direction tally (4 downward vs. 4 upward) -> not more, so unfavourable', () => {
    const m3 = result.methods.find((m) => m.method.id === 'stay-house-method-3')!;
    expect(m3.verdict!.outcome).toBe('unfavourable');
    expect(m3.verdict!.label).toBe('4 downward vs. 4 upward');
  });

  it('a genuine 1-favourable-vs-2-unfavourable split is mostly_agree, not silently resolved', () => {
    expect(result.calculationDetails.consensus.level).toBe('mostly_agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('Good to stay in a town (ch.22)', () => {
  const result = runEngine(chart, 'if-it-s-good-to-stay-in-a-2')!;

  it('Method 1: H4 = Iddris, good -> favourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'stay-town-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('Method 2: whole-chart fortune tally (8 good vs. 4 bad) -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'stay-town-method-2')!;
    expect(m2.verdict!.outcome).toBe('favourable');
    expect(m2.verdict!.label).toBe('8 good vs. 4 bad');
  });

  it('both methods agree favourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('favourable');
  });
});

describe('Terrain type (ch.23) — descriptive, not favourable/unfavourable', () => {
  // Prompt 4.5 superseded these assertions: forcing this method to
  // `needs_review` (and the whole question to `insufficient_data`) was
  // never a real source-verification gap — it was an architectural
  // workaround for an engine that had no outcome value for a categorical
  // answer. Now that `outcome: 'descriptive'` exists, this fully-computable
  // method is honestly `verified`, and the question resolves to a real,
  // successful `descriptive` result instead of a fabricated-sounding
  // "insufficient data" for an answer the source actually gives cleanly.
  const result = runEngine(chart, 'is-there-much-trees-water-sand-or-stones')!;

  it('computes the element (Ali, air) and now asserts a real, verified descriptive verdict', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('verified');
    expect(m1.calculation!.resultFigure.figureId).toBe('ali');
    expect(m1.calculation!.resultFigure.element).toBe('air');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('air');
    expect(m1.verdict!.interpretation).toBe('The area has much trees.');
  });

  it('resolves to a real descriptive result, never favourable/unfavourable/insufficient', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.kind).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree'); // a single computable method agrees with itself
  });

  it('ReadingResult: shows the answer as a successful reading, not a fabricated favourable/unfavourable badge', () => {
    const reading = runReading(chart, 'is-there-much-trees-water-sand-or-stones')!;
    expect(reading.isInsufficient).toBe(false);
    expect(reading.resultKind).toBe('descriptive');
    // The ReadingResult-level answer is the human-readable label ("Much
    // trees"), never the raw MethodVerdict.descriptiveAnswer comparison key
    // ("air") — Prompt 4.5 follow-up fix: compareDescriptiveResults was
    // copying the raw key straight into MethodConsensus.descriptiveAnswer,
    // which OutcomeCard then displayed verbatim ("READING: Air" instead of
    // "READING: Much trees"), found via a live browser check of this exact
    // fixture chart's ch.23/31/36 readings.
    expect(reading.descriptiveAnswer).toBe('Much trees');
    expect(reading.primaryFigure).not.toBeNull();
    expect(reading.primaryFigure!.methodOutcome).toBe('descriptive');
    expect(reading.primaryFigure!.methodOutcomeLabel).toBe('Much trees');
  });
});

describe('Safe in a canoe (ch.24)', () => {
  const result = runEngine(chart, 'if-you-will-be-safe-entering-a-canoe')!;

  it('Method 1: H10+H12+H14+H15 = Kalla Allahu, upward -> favourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'canoe-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('Method 2: H1+H5+H9+H13 = Umar, level direction -> uncertain (outside upward/downward)', () => {
    const m2 = result.methods.find((m) => m.method.id === 'canoe-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('umar');
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('only Method 1 counts; overall is favourable', () => {
    expect(result.overallResult).toBe('favourable');
    expect(result.calculationDetails.consensus.verifiableCount).toBe(1);
  });
});

describe('Safe-in-canoe Method 2 conditional branches (isolated, not on the fixture chart)', () => {
  // The fixture chart only exercises the "level" branch for Method 2 above;
  // these directly exercise the nested fortune+direction combinations the
  // source itself distinguishes, per Prompt 4 section 7 ("do not flatten
  // conditional outcomes").
  it('upward + bad -> mixed (safe, but no extra fish/money), never plain favourable', async () => {
    const { safeInCanoeQuestion } = await import('../questions/safeInCanoe');
    const method2 = safeInCanoeQuestion.methods[1];
    const badUpward = {
      figureId: 'issah',
      figureName: 'Issah',
      classicalName: 'Amissio',
      dotPattern: [1, 2, 1, 2] as Pattern,
      element: 'water' as const,
      qualities: {
        fortune: { value: 'bad' as const, status: 'verified' as const, source: { kind: 'classical-tradition' as const } },
        direction: { value: 'upward' as const, status: 'verified' as const, source: { kind: 'classical-tradition' as const } },
        lineStates: { fire: 'opened' as const, air: 'closed' as const, water: 'opened' as const, sand: 'closed' as const },
        stability: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
        gender: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
        dayNight: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
      },
      sourceHouses: [1, 5, 9, 13],
    };
    const verdict = method2.evaluate({ housesUsed: [1, 5, 9, 13], steps: [], resultFigure: badUpward }, {} as any);
    expect(verdict.outcome).toBe('mixed');
  });

  it('downward + good -> mixed (rescued, but not fully safe), never plain unfavourable', async () => {
    const { safeInCanoeQuestion } = await import('../questions/safeInCanoe');
    const method2 = safeInCanoeQuestion.methods[1];
    const goodDownward = {
      figureId: 'nuhu',
      figureName: 'Nuhu',
      classicalName: 'Fortuna Major',
      dotPattern: [2, 2, 1, 1] as Pattern,
      element: 'air' as const,
      qualities: {
        fortune: { value: 'good' as const, status: 'verified' as const, source: { kind: 'classical-tradition' as const } },
        direction: { value: 'downward' as const, status: 'verified' as const, source: { kind: 'classical-tradition' as const } },
        lineStates: { fire: 'closed' as const, air: 'closed' as const, water: 'opened' as const, sand: 'opened' as const },
        stability: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
        gender: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
        dayNight: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
      },
      sourceHouses: [1, 5, 9, 13],
    };
    const verdict = method2.evaluate({ housesUsed: [1, 5, 9, 13], steps: [], resultFigure: goodDownward }, {} as any);
    expect(verdict.outcome).toBe('mixed');
  });
});

describe('Armed robbers (ch.25)', () => {
  const result = runEngine(chart, 'if-there-are-armed-robbers-on-your-way')!;

  it('H9+H8+H12+H16 = Umar (air) — the source only defines the water branch, so a non-water result is uncertain', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.element).toBe('air');
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('never assumes "not water" means safe — reports insufficient_data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Fight/argument (ch.26) — fully blocked by omitted figures', () => {
  it('reports insufficient_data; the figure/method shape is still shown as uncertain', () => {
    const result = runEngine(chart, 'if-there-will-be-a-fight-argument-etc')!;
    expect(result.overallResult).toBe('insufficient_data');
    expect(result.methods[0].method.status).toBe('uncertain');
    expect(result.methods[0].calculation).toBeNull();
  });
});

describe('Farming and food (ch.27) — fully blocked by omitted figures', () => {
  it('reports insufficient_data across both uncomputable methods', () => {
    const result = runEngine(chart, 'about-farming-and-food-in-the-year')!;
    expect(result.overallResult).toBe('insufficient_data');
    expect(result.methods).toHaveLength(2);
    result.methods.forEach((m) => expect(m.method.status).toBe('uncertain'));
  });
});

describe('Money or good strangers (ch.28)', () => {
  const result = runEngine(chart, 'if-you-will-get-money-or-good-strangers')!;

  it('computes the water-extract + add-to-H7 + presence check, but this chart\'s result is not found — source is silent on that branch', () => {
    const m1 = result.methods[0];
    expect(m1.calculation).not.toBeNull();
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('never assumes "not found" means unfavourable — reports insufficient_data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Success where going (ch.29)', () => {
  const result = runEngine(chart, 'if-you-will-be-successful-where-you-are')!;

  it('H3+H7+H11+H15 = Yussif, water line closed -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.calculation!.resultFigure.qualities.lineStates.water).toBe('closed');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('Successful trip (ch.30)', () => {
  const result = runEngine(chart, 'if-you-will-be-successful-and-get-what')!;

  it('H1+H8+H7+H11, +H16 = Musah, level direction -> uncertain (outside upward/downward)', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('musah');
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('never manufactures an answer for a level result', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Successful-trip conditional branches (isolated, not on the fixture chart)', () => {
  it('a downward result is "mixed" (a real delay), never flattened to unfavourable', async () => {
    const { successfulTripQuestion } = await import('../questions/successfulTrip');
    const method1 = successfulTripQuestion.methods[0];
    const downward = {
      figureId: 'mahadi',
      figureName: 'Mahadi',
      classicalName: 'Caput Draconis',
      dotPattern: [2, 1, 1, 1] as Pattern,
      element: 'air' as const,
      qualities: {
        fortune: { value: 'good' as const, status: 'verified' as const, source: { kind: 'classical-tradition' as const } },
        direction: { value: 'downward' as const, status: 'verified' as const, source: { kind: 'classical-tradition' as const } },
        lineStates: { fire: 'closed' as const, air: 'opened' as const, water: 'opened' as const, sand: 'opened' as const },
        stability: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
        gender: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
        dayNight: { value: null, status: 'needs_review' as const, source: { kind: 'unsourced' as const, note: '' } },
      },
      sourceHouses: [1, 8, 7, 11, 16],
    };
    const verdict = method1.evaluate({ housesUsed: [1, 8, 7, 11, 16], steps: [], resultFigure: downward }, {} as any);
    expect(verdict.outcome).toBe('mixed');
    expect(verdict.interpretation).toContain('patient');
  });
});

describe('Lost thing / thief location (ch.31) — descriptive', () => {
  // Prompt 4.5 superseded these assertions — same reasoning as chapter 23
  // above: this is a fully-computable, verified method that answers
  // descriptively (gender + quarter), not an unverifiable one.
  const result = runEngine(chart, 'about-a-lost-thing-stolen-things')!;

  it('computes gender and quarter as a real, verified descriptive verdict', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('verified');
    expect(m1.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m1.calculation!.resultFigure.element).toBe('water'); // -> female thief
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('female:not-found'); // H4+H5 = Hassan & Hussein, not one of this chart's own 16 house figures
    expect(m1.verdict!.interpretation).toContain('female');
    expect(m1.verdict!.interpretation).toContain('not found anywhere in the chart');
  });

  it('resolves to a real descriptive result, never favourable/unfavourable/insufficient', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.kind).toBe('descriptive');
  });
});

describe('Will it rain (ch.32)', () => {
  const result = runEngine(chart, 'if-it-will-rain-today-or-not')!;

  it('Method 1: Ali does not follow Ali on this chart -> uncertain (source only defines the positive trigger)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'rain-method-1')!;
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2: Kalla Allahu is not at H4 on this chart -> uncertain', () => {
    const m2 = result.methods.find((m) => m.method.id === 'rain-method-2')!;
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('Method 3: Iddris is not at H9 on this chart (H9 = Usman) -> uncertain', () => {
    const m3 = result.methods.find((m) => m.method.id === 'rain-method-3')!;
    expect(m3.calculation!.resultFigure.figureId).toBe('usman');
    expect(m3.verdict!.outcome).toBe('uncertain');
  });

  it('Method 4: H14 and H15 are both water (Ibrahim, Ibrahim) -> favourable', () => {
    const m4 = result.methods.find((m) => m.method.id === 'rain-method-4')!;
    expect(m4.verdict!.outcome).toBe('favourable');
  });

  it('only Method 4 counts; overall is favourable', () => {
    expect(result.overallResult).toBe('favourable');
    expect(result.calculationDetails.consensus.verifiableCount).toBe(1);
  });
});

describe('Enemies working against you (ch.34)', () => {
  const result = runEngine(chart, 'if-your-enemies-are-working-against-you-or')!;

  it('Method 1: recasts H3/H7/H11/H15 as new Mothers; new H13 = Yussif, water line closed -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'enemies-working-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.calculation!.resultFigure.qualities.lineStates.water).toBe('closed');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H1+H12 = Umar, bad -> unfavourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'enemies-working-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('umar');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('both methods agree unfavourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });

  it('recasting does not disturb the original chart\'s own houses', () => {
    expect(chart.houses).toHaveLength(16);
    expect(chart.houses[2].star.id).toBe('mahadi'); // H3 unchanged
  });
});

describe('Family doing well (ch.35)', () => {
  const result = runEngine(chart, 'if-your-family-is-doing-well-while-you')!;

  it('H1+H4+H7+H10 = Sulemana, found among the Nieces (H9-12) -> mixed', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('sulemana');
    expect(m1.verdict!.outcome).toBe('mixed');
    expect(m1.verdict!.interpretation).toContain('financial problems');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('mixed');
  });
});

describe('Locate someone or something (ch.36) — descriptive', () => {
  // Prompt 4.5 superseded these assertions — same reasoning as chapters 23/31.
  const result = runEngine(chart, 'if-you-want-to-locate-someone-or-something')!;

  it('extracts fire@H1/air@H2/water@H3/sand@H4 = Issah (water) as a real, verified descriptive verdict', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('verified');
    expect(m1.calculation!.resultFigure.element).toBe('water');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('water');
    expect(m1.verdict!.label).toBe('Northern direction');
  });

  it('resolves to a real descriptive result, never insufficient', () => {
    expect(result.overallResult).toBe('descriptive');
  });
});

describe('Predict a game winner (ch.37)', () => {
  const result = runEngine(chart, 'how-to-predict-a-game-who-will-win')!;

  it('Method 1: H1 (bad) ranks below H2 (good) -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'game-winner-method-1')!;
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: uncertain — no left/right spatial layout in this project\'s ChartModel', () => {
    const m2 = result.methods.find((m) => m.method.id === 'game-winner-method-2')!;
    expect(m2.method.status).toBe('uncertain');
    expect(m2.calculation).toBeNull();
  });

  it('only Method 1 counts; overall is unfavourable', () => {
    expect(result.overallResult).toBe('unfavourable');
    expect(result.calculationDetails.consensus.verifiableCount).toBe(1);
  });
});

describe('Game-winner Method 1 tie branches (isolated, not on the fixture chart)', () => {
  it('a tie at "good" is a scoring draw, kept as mixed rather than favourable or unfavourable', async () => {
    const { predictGameWinnerQuestion } = await import('../questions/predictGameWinner');
    const method1 = predictGameWinnerQuestion.methods[0];
    const chartWithTie = buildChartLike(['good', 'good']);
    const verdict = method1.evaluate({ housesUsed: [1, 2], steps: [], resultFigure: chartWithTie.houses[0] as any }, chartWithTie as any);
    expect(verdict.outcome).toBe('mixed');
    expect(verdict.interpretation).toBe('Both teams will score a draw.');
  });

  it('a tie at "bad" is a goalless draw, also kept as mixed', async () => {
    const { predictGameWinnerQuestion } = await import('../questions/predictGameWinner');
    const method1 = predictGameWinnerQuestion.methods[0];
    const chartWithTie = buildChartLike(['bad', 'bad']);
    const verdict = method1.evaluate({ housesUsed: [1, 2], steps: [], resultFigure: chartWithTie.houses[0] as any }, chartWithTie as any);
    expect(verdict.outcome).toBe('mixed');
    expect(verdict.interpretation).toBe('There will be a goalless draw or no win.');
  });
});

function buildChartLike(fortunes: [string, string]) {
  const q = (fortune: string) => ({
    fortune: { value: fortune, status: 'verified', source: { kind: 'classical-tradition' } },
    direction: { value: null, status: 'verified', source: { kind: 'classical-tradition' } },
    lineStates: { fire: 'opened', air: 'opened', water: 'opened', sand: 'opened' },
    stability: { value: null, status: 'needs_review', source: { kind: 'unsourced', note: '' } },
    gender: { value: null, status: 'needs_review', source: { kind: 'unsourced', note: '' } },
    dayNight: { value: null, status: 'needs_review', source: { kind: 'unsourced', note: '' } },
  });
  return {
    houses: fortunes.map((f, i) => ({ houseNumber: i + 1, qualities: q(f) })),
  };
}

describe('Lovers compatible (ch.38)', () => {
  const result = runEngine(chart, 'if-two-lovers-will-be-compatible-for-marriage')!;

  it('Method 1: H4+H15 = Yussif, bad -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'lovers-compatible-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H1+H7 = Hassan & Hussein, bad -> unfavourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'lovers-compatible-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('both methods agree unfavourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('Visitor good or bad (ch.39)', () => {
  const result = runEngine(chart, 'if-your-visitor-or-the-person-that-comes')!;

  it('Method 1: H1 = Yussif, bad -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'visitor-good-bad-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H9+H12 = Kalla Allahu, good -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'visitor-good-bad-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('a genuine conflict is preserved as mixed', () => {
    expect(result.calculationDetails.consensus.level).toBe('conflict');
    expect(result.overallResult).toBe('mixed');
  });

  it('ReadingResult: both methods counted, conflict flagged, no averaged verdict', () => {
    const reading = runReading(chart, 'if-your-visitor-or-the-person-that-comes')!;
    expect(reading.conflictingIndicators).toBe(true);
    expect(reading.methodResults.filter((m) => m.counted)).toHaveLength(2);
    expect(reading.disagreementNote).not.toBeNull();
  });
});

describe('Spiritual work will it work (ch.40)', () => {
  const result = runEngine(chart, 'if-spiritual-work-you-want-to-do-for')!;

  it('Method 1: H1+H5 = Ayuba, bad -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'spiritual-work-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H5+H11 = Issah, bad -> unfavourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'spiritual-work-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('issah');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('both methods agree unfavourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('Chapter 33 ("cast out by 4s") is not registered', () => {
  it('falls back to null — it uses a separate, non-chart-based divination mechanic this app does not support', () => {
    expect(runEngine(chart, 'if-someone-loves-you-much-less-or-not')).toBeNull();
  });
});

describe('Chapter 28 continuation fragments are not registered', () => {
  it('both fall back to null — no computable shape at all (every figure token was dropped, not just omitted)', () => {
    expect(runEngine(chart, 'continued-from-chapter-twenty-eight')).toBeNull();
    expect(runEngine(chart, 'reading-the-gift-visitor-figures-end-of-chapter')).toBeNull();
  });
});

describe('ReadingResult smoke test for every newly registered question (ch.20-40)', () => {
  const ids = [
    'who-will-win-an-election-or-a-chieftaincy',
    'if-your-wife-or-sister-has-had-sex',
    'if-it-s-good-to-stay-in-a',
    'if-it-s-good-to-stay-in-a-2',
    'is-there-much-trees-water-sand-or-stones',
    'if-you-will-be-safe-entering-a-canoe',
    'if-there-are-armed-robbers-on-your-way',
    'if-there-will-be-a-fight-argument-etc',
    'about-farming-and-food-in-the-year',
    'if-you-will-get-money-or-good-strangers',
    'if-you-will-be-successful-where-you-are',
    'if-you-will-be-successful-and-get-what',
    'about-a-lost-thing-stolen-things',
    'if-it-will-rain-today-or-not',
    'if-your-enemies-are-working-against-you-or',
    'if-your-family-is-doing-well-while-you',
    'if-you-want-to-locate-someone-or-something',
    'how-to-predict-a-game-who-will-win',
    'if-two-lovers-will-be-compatible-for-marriage',
    'if-your-visitor-or-the-person-that-comes',
    'if-spiritual-work-you-want-to-do-for',
  ];

  it.each(ids)('%s produces a valid, non-crashing ReadingResult with a source reference', (id) => {
    const reading = runReading(chart, id);
    expect(reading).not.toBeNull();
    expect(reading!.questionId).toBe(id);
    expect(reading!.sourceReferences.length).toBeGreaterThan(0);
    expect(reading!.sourceReferences[0].book).toBe('Kanzul Mikban');
    // Every method row is internally consistent: a counted row always has a
    // non-null outcome, and an uncounted row is never falsely marked as agreeing.
    reading!.methodResults.forEach((m) => {
      if (m.counted) expect(m.outcome).not.toBeNull();
      else expect(m.agreesWithOverall).toBeNull();
    });
  });
});
