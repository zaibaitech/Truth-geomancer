// Stage 5 of the engine's question coverage — Prompt 7, Kanzul Mikban
// chapters 61-80 plus one unnumbered fragment ("If She/He Is Still in the
// Marriage", registered as its own question; see COVERAGE.md for why this
// diverges from Prompt 6's decision to leave the ch.52 fragment
// unregistered). The "Someone's Behavior" fragment after ch.64 is a
// confirmed exact duplicate of ch.43's own Method 1 and was deliberately
// NOT registered as a separate question — see marriageLastForever.ts's
// header comment. Same fixture chart as the rest of the suite; every
// expected figure/outcome below was read straight off a printed audit run
// of runEngine/runReading against this exact chart before being relied on
// here — not guessed.
import { describe, expect, it } from 'vitest';
import { runEngine, runReading } from '../index';
import { QUESTION_REGISTRY } from '../questions';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();

describe('If a marriage is good or not (ch.61) — a genuine conflict, not averaged', () => {
  const result = runEngine(chart, 'if-a-marriage-is-good-or-not')!;

  it('Method 1: H7 = Nuhu, good and downward -> favourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'marriage-good-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('good');
    expect(m1.calculation!.resultFigure.qualities.direction.value).toBe('downward');
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.label).toBe('Good star');
  });

  it('Method 2: H3+H7+H11+H14 = Yussif, bad -> unfavourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'marriage-good-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m2.calculation!.resultFigure.qualities.fortune.value).toBe('bad');
    expect(m2.verdict!.outcome).toBe('unfavourable');
    expect(m2.verdict!.label).toBe('Bad star');
  });

  it('a genuine conflict between the two methods is preserved as "mixed", not averaged', () => {
    expect(result.calculationDetails.consensus.level).toBe('conflict');
    expect(result.overallResult).toBe('mixed');
  });
});

describe('If the prayers done for someone have been answered (ch.62)', () => {
  const result = runEngine(chart, 'if-the-prayers-done-for-someone-have-been')!;

  it('the 4 quarter water-elements add up to Ayuba, bad and downward -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('bad');
    expect(m1.calculation!.resultFigure.qualities.direction.value).toBe('downward');
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.label).toBe('Water line closed');
  });

  it('overall matches the one verified method', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('If the lady or man you are going to marry is related by family (ch.63) — descriptive', () => {
  const result = runEngine(chart, 'if-the-lady-or-man-you-are-going')!;

  it('H7 = Nuhu, not found in any of the other three quarters -> descriptive "not a fellow citizen"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'related-by-family-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.label).toBe('Not a fellow citizen');
    expect(m1.verdict!.descriptiveAnswer).toBe('not-a-citizen');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.kind).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree');
    const reading = runReading(chart, 'if-the-lady-or-man-you-are-going')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Not a fellow citizen');
  });
});

describe('If a marriage will last forever (ch.64)', () => {
  const result = runEngine(chart, 'if-a-marriage-will-last-forever')!;

  it('Method 1: H3 = Mahadi, good and downward -> favourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'marriage-last-forever-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('mahadi');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('good');
    expect(m1.calculation!.resultFigure.qualities.direction.value).toBe('downward');
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.label).toBe('Good star');
  });

  it("Method 2: the source states the calculation but never says what the result means -> 'uncertain' status, never produces a verdict", () => {
    const m2 = result.methods.find((m) => m.method.id === 'marriage-last-forever-method-2')!;
    expect(m2.method.status).toBe('uncertain');
    const def = QUESTION_REGISTRY['if-a-marriage-will-last-forever'].methods.find((m) => m.id === 'marriage-last-forever-method-2')!;
    expect(def.reviewReasonCode).toBe('interpretation_not_stated');
    expect(m2.verdict).toBeNull();
  });

  it('overall matches the one verified method', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('favourable');
  });
});

describe('If a partner has a particular disease or health problem (ch.65)', () => {
  const result = runEngine(chart, 'if-a-partner-has-a-particular-disease-or')!;

  it('Method 1: Issah is at H6 -> unfavourable (positive trigger only)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'partner-disease-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('issah');
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.label).toBe('Issah at H6');
  });

  it('Method 2: H14 is Ibrahim, not Issah -> uncertain (positive trigger only)', () => {
    const m2 = result.methods.find((m) => m.method.id === 'partner-disease-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m2.verdict!.outcome).toBe('uncertain');
    expect(m2.verdict!.label).toBe('Not Issah at H14');
  });

  it('Method 3: H6 is Issah, not Ayuba -> uncertain (positive trigger only)', () => {
    const m3 = result.methods.find((m) => m.method.id === 'partner-disease-method-3')!;
    expect(m3.calculation!.resultFigure.figureId).toBe('issah');
    expect(m3.verdict!.outcome).toBe('uncertain');
    expect(m3.verdict!.label).toBe('Not Ayuba at H6');
  });

  it('only Method 1 counts -> unfavourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('If someone has married before (ch.66) — descriptive', () => {
  const result = runEngine(chart, 'if-someone-has-married-before-or-if-he')!;

  it('H10 = Usman, downward -> descriptive "married"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'married-before-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('usman');
    expect(m1.calculation!.resultFigure.qualities.direction.value).toBe('downward');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('married');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree');
    const reading = runReading(chart, 'if-someone-has-married-before-or-if-he')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Married');
  });
});

describe('If she/he is still in the marriage (unnumbered fragment after ch.66) — descriptive', () => {
  const result = runEngine(chart, 'if-she-he-is-still-in-the-marriage')!;

  it('H5+H9+H10+H11 = Issah, found in the chart -> descriptive "still in the marriage"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'still-in-marriage-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('issah');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.label).toBe('Still in the marriage');
    expect(m1.verdict!.descriptiveAnswer).toBe('still-in-marriage');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree');
    const reading = runReading(chart, 'if-she-he-is-still-in-the-marriage')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Still in the marriage');
  });
});

describe('If he/she is enjoying the marriage (ch.67)', () => {
  const result = runEngine(chart, 'if-he-she-is-enjoying-the-marriage')!;

  it('fire/air/water/sand-quartet sum = Iddris, good but level (neither up nor down) -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'enjoying-marriage-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('good');
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m1.verdict!.label).toBe('Good, level');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
    expect(result.calculationDetails.consensus.level).toBe('insufficient_data');
    const reading = runReading(chart, 'if-he-she-is-enjoying-the-marriage')!;
    expect(reading.isInsufficient).toBe(true);
  });
});

describe('If your partner is cheating on you (ch.68) — blocked by two independent, unsourced gaps', () => {
  const result = runEngine(chart, 'if-your-partner-is-cheating-on-you')!;

  it('Method 1: gender classification is not defined, and the app has no querent-gender input either -> needs_review, excluded', () => {
    const m1 = result.methods.find((m) => m.method.id === 'partner-cheating-method-1')!;
    expect(m1.method.status).toBe('needs_review');
    const def = QUESTION_REGISTRY['if-your-partner-is-cheating-on-you'].methods.find((m) => m.id === 'partner-cheating-method-1')!;
    expect(def.reviewReasonCode).toBe('gender_classification_unsourced');
    expect(m1.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m1.verdict).toBeNull();
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
    const reading = runReading(chart, 'if-your-partner-is-cheating-on-you')!;
    expect(reading.isInsufficient).toBe(true);
  });
});

describe('If your ex-husband/wife will re-marry (ch.69)', () => {
  const result = runEngine(chart, 'if-your-ex-husband-wife-will-re-marry')!;

  it('H5+H7 = Ibrahim, middle-good -> mixed', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('middleGood');
    expect(m1.verdict!.outcome).toBe('mixed');
    expect(m1.verdict!.label).toBe('Middle-good star');
  });

  it('overall matches the one verified method', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('mixed');
  });
});

describe('If a pregnant woman will have childbirth problems (ch.70)', () => {
  const result = runEngine(chart, 'if-a-pregnant-woman-will-have-childbirth-problems')!;

  it('Method 1: H7 is Nuhu, not Yunus -> uncertain (positive trigger only)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'childbirth-problems-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m1.verdict!.label).toBe('Not Yunus at H7');
  });

  it('Method 2: H5 is Kalla Allahu, not Yussif -> uncertain (positive trigger only)', () => {
    const m2 = result.methods.find((m) => m.method.id === 'childbirth-problems-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m2.verdict!.outcome).toBe('uncertain');
    expect(m2.verdict!.label).toBe('Not Yusuf at H5');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
    const reading = runReading(chart, 'if-a-pregnant-woman-will-have-childbirth-problems')!;
    expect(reading.isInsufficient).toBe(true);
  });
});

describe('If a man will have manhood problems (ch.71)', () => {
  const result = runEngine(chart, 'if-a-man-will-have-manhood-problems-in')!;

  it('Method 1: H3 is Mahadi, not Sulemana -> uncertain (positive trigger only)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'manhood-problems-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('mahadi');
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2: H5 is Kalla Allahu, not Ayuba -> uncertain (positive trigger only)', () => {
    const m2 = result.methods.find((m) => m.method.id === 'manhood-problems-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
    const reading = runReading(chart, 'if-a-man-will-have-manhood-problems-in')!;
    expect(reading.isInsufficient).toBe(true);
  });
});

describe('If a lady or man has feelings for you (ch.72)', () => {
  const result = runEngine(chart, 'if-a-lady-or-man-has-feelings-for')!;

  it('H7+H11+H5 = Sulemana, bad -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('sulemana');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('bad');
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.label).toBe('Bad star');
  });

  it('overall matches the one verified method', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('If a woman has married more than one man (ch.73) — descriptive', () => {
  const result = runEngine(chart, 'if-a-woman-has-married-more-than-one')!;

  it('H7 = Nuhu -> descriptive "one man" (exhaustive 16-figure lookup table)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'polyandry-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.label).toBe('one man');
    expect(m1.verdict!.descriptiveAnswer).toBe('one-man');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree');
    const reading = runReading(chart, 'if-a-woman-has-married-more-than-one')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('one man');
  });
});

describe('If someone is an adulterous son/daughter born out of wedlock (ch.74)', () => {
  const result = runEngine(chart, 'if-someone-is-an-adulterous-son-daughter-born')!;

  it('sand-sand quartet elements (h4,h8,h12,h16) sum to Iddris, found in the chart -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'born-out-of-wedlock-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('good');
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.label).toBe('Found in the chart');
  });

  it('overall matches the one verified method', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('If he/she is a womanizer (ch.75)', () => {
  const result = runEngine(chart, 'if-he-she-is-a-womanizer-or-a')!;

  it('H7+H9 = Ali, neither Kalla Allahu nor Yusuf -> favourable (fully binary)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'womanizer-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ali');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('middleGood');
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.label).toBe('Neither Kalla Allahu nor Yusuf');
  });

  it('overall matches the one verified method', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('favourable');
  });
});

describe('If your ex will come back (ch.76)', () => {
  const result = runEngine(chart, 'if-your-ex-husband-wife-girlfriend-or-boyfriend')!;

  it('Method 1: H8,H9,H11,H15 are not all opened -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'ex-return-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('issah');
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m1.verdict!.label).toBe('Not all water lines opened');
  });

  it('Method 2: H5,H6,H7 are mixed, neither all-opened nor all-closed -> uncertain', () => {
    const m2 = result.methods.find((m) => m.method.id === 'ex-return-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m2.verdict!.outcome).toBe('uncertain');
    expect(m2.verdict!.label).toBe('Water lines mixed');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
    const reading = runReading(chart, 'if-your-ex-husband-wife-girlfriend-or-boyfriend')!;
    expect(reading.isInsufficient).toBe(true);
  });
});

describe('If the pregnancy is healthy or not (ch.77)', () => {
  const result = runEngine(chart, 'if-the-pregnancy-is-healthy-or-not')!;

  it('Method 1: H4,H7,H10,H15 are not all good (H15 = Ibrahim, middle-good) -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'pregnancy-healthy-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m1.verdict!.label).toBe('Not all good stars');
  });

  it('Method 2: H8 = Issah, bad -> unfavourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'pregnancy-healthy-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('issah');
    expect(m2.calculation!.resultFigure.qualities.fortune.value).toBe('bad');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('only Method 2 counts -> unfavourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('The number of months of a pregnancy (ch.78) — descriptive', () => {
  const result = runEngine(chart, 'the-number-of-months-of-a-pregnancy-how')!;

  it('opened lines H1-H6 = 12, cast out by 9s = 3 -> descriptive "3 months"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'pregnancy-months-method-1')!;
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.label).toBe('3 months');
    expect(m1.verdict!.descriptiveAnswer).toBe('3');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree');
    const reading = runReading(chart, 'the-number-of-months-of-a-pregnancy-how')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('3 months');
  });
});

describe('The number of babies in a pregnancy (ch.79) — descriptive but insufficient data', () => {
  const result = runEngine(chart, 'the-number-of-babies-in-a-pregnancy')!;

  it('Method 1: H10 is Usman, not Musah -> uncertain (positive trigger only)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'number-of-babies-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('usman');
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m1.verdict!.label).toBe('Not Musah at H10');
  });

  it("Method 2: H5's own figure occurs exactly once in the chart -> uncertain (only 2, 3, and >3 are addressed)", () => {
    const m2 = result.methods.find((m) => m.method.id === 'number-of-babies-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m2.verdict!.outcome).toBe('uncertain');
    expect(m2.verdict!.label).toBe('Occurs 1 time(s)');
  });

  it('no method counts -> insufficient data, even though the question is descriptive-kind', () => {
    expect(result.overallResult).toBe('insufficient_data');
    expect(result.calculationDetails.consensus.level).toBe('insufficient_data');
    const reading = runReading(chart, 'the-number-of-babies-in-a-pregnancy')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.isInsufficient).toBe(true);
    expect(reading.descriptiveAnswer).toBeNull();
  });
});

describe('If a pregnancy is yours or not (ch.80) — descriptive', () => {
  const result = runEngine(chart, 'if-a-pregnancy-is-yours-or-not-d')!;

  it('Method 1: H1+H5 = Ayuba, not found in the chart -> descriptive "not yours"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'pregnancy-paternity-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('not-yours');
  });

  it('Method 2: H10 is good but H11 = Ali is middle-good, not both good -> descriptive "not yours"', () => {
    const m2 = result.methods.find((m) => m.method.id === 'pregnancy-paternity-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ali');
    expect(m2.verdict!.outcome).toBe('descriptive');
    expect(m2.verdict!.descriptiveAnswer).toBe('not-yours');
  });

  it('both methods agree -> a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree');
    const reading = runReading(chart, 'if-a-pregnancy-is-yours-or-not-d')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Not yours');
  });
});
