// Stage 8 of the engine's question coverage — Prompt 11, Kanzul Mikban
// chapters 121-140. Same fixture chart as the rest of the suite; every
// expected figure/outcome below was read straight off a printed audit run
// of runEngine/runReading against this exact chart before being relied on
// here — not guessed. Several values were additionally cross-checked for
// internal consistency: chapters 129/130 Method 1 (direction) both read H4
// and independently compute the same "level" result; chapters 124/137
// Method 2 share the identical H1+H5 calculation and independently compute
// the same result; chapters 139/140 share the identical H1+H3 calculation
// and partition it by direction.
import { describe, expect, it } from 'vitest';
import { runEngine, runReading } from '../index';
import { QUESTION_REGISTRY } from '../questions';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();

describe('Will I gain knowledge and wisdom (ch.121) — H1 is neither Adam nor Ali', () => {
  const result = runEngine(chart, 'if-you-will-get-knowledge-or-not-in')!;

  it('Method 1: H1 = Yussif -> uncertain, excluded', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Will I get what I want, very close (ch.122) — direction inconclusive, stability blocked', () => {
  const result = runEngine(chart, 'if-you-will-get-what-you-want-or')!;

  it('Method 1 (direction): H7=Nuhu, H12=Sulemana, not both downward -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'get-what-you-want-very-close-method-1-direction')!;
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 1 (stability) is blocked with no verdict', () => {
    const def = QUESTION_REGISTRY['if-you-will-get-what-you-want-or'].methods.find((m) => m.id === 'get-what-you-want-very-close-method-1-stability')!;
    expect(def.status).toBe('needs_review');
    expect(def.reviewReasonCode).toBe('stability_classification_unsourced');
  });

  it('Method 2 (direction): H11=Ali, not downward -> uncertain', () => {
    const m2 = result.methods.find((m) => m.method.id === 'get-what-you-want-very-close-method-2-direction')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ali');
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Will something burn (ch.123) — not all four fire lines opened', () => {
  const result = runEngine(chart, 'if-something-will-burn')!;

  it('H9 fire line is closed, so not all four are opened -> uncertain', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Has this really been stolen (ch.124) — Method 1 blocked, Method 2 verified', () => {
  const result = runEngine(chart, 'if-something-has-really-been-stolen-or-not')!;

  it('Method 1: trigger figures omitted -> uncertain, excluded', () => {
    const m1 = result.methods.find((m) => m.method.id === 'something-really-stolen-method-1')!;
    expect(m1.method.status).toBe('uncertain');
    expect(m1.verdict).toBeNull();
  });

  it('Method 2: H1+H5 sum not found anywhere in the chart -> descriptive "no"', () => {
    const m2 = result.methods.find((m) => m.method.id === 'something-really-stolen-method-2')!;
    expect(m2.verdict!.outcome).toBe('descriptive');
    expect(m2.verdict!.descriptiveAnswer).toBe('no');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'if-something-has-really-been-stolen-or-not')!;
    expect(reading.descriptiveAnswer).toBe('Not stolen');
  });
});

describe('Will the stolen thing be returned (ch.125) — fallback branch via H2', () => {
  const result = runEngine(chart, 'if-they-will-return-a-stolen-thing-back')!;

  it('H1 bad triggers the fallback; H2 = Adam (good) -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.label).toBe('Fallback: H2 good');
  });

  it('resolves as a real favourable result', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('How many thieves (ch.126) — H7 = Nuhu, occurs once', () => {
  const result = runEngine(chart, 'the-number-of-thieves')!;

  it('Nuhu occurs exactly once (H7 itself) -> descriptive "1 thief"', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('1');
    expect(m1.verdict!.label).toBe('1 thief');
  });
});

describe('The description of the thief (ch.127) — gender classification investigation', () => {
  const result = runEngine(chart, 'the-description-of-the-thief')!;

  it('Method 1 (H1) and Method 2 (H7) are both blocked on the unsourced gender classification', () => {
    result.methods.forEach((m) => {
      expect(m.method.status).toBe('needs_review');
      expect(m.verdict).toBeNull();
    });
    const defs = QUESTION_REGISTRY['the-description-of-the-thief'].methods;
    defs.forEach((d) => expect(d.reviewReasonCode).toBe('gender_classification_unsourced'));
  });

  it('Chapter 127 uses "male/female star" terminology but supplies no mapping — the classification stays unsourced', () => {
    // Sanity check on the audit itself: chapters 41/48/68 remain the only
    // other known gender-blocked methods as of Prompt 11; chapter 127 adds
    // two more to the same unresolved axis, not a fifth distinct one.
    // (Prompt 12 later adds a 7th occurrence at chapter 141 — see
    // audit-1-151.test.ts for the up-to-date running total.)
    const audit = QUESTION_REGISTRY;
    const genderBlockedCount = Object.values(audit).reduce(
      (sum, q) => sum + q.methods.filter((m) => m.reviewReasonCode === 'gender_classification_unsourced').length,
      0,
    );
    expect(genderBlockedCount).toBe(7); // ch.41 M1, ch.48 M1/M2, ch.68 M1, ch.127 M1/M2, ch.141 M1
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Is the thief still in town (ch.128) — H1 not found elsewhere', () => {
  const result = runEngine(chart, 'if-the-thief-or-the-stolen-thing-is')!;

  it('Yussif (H1) does not repeat at H2-H16 -> descriptive "out of town"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('out-of-town');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'if-the-thief-or-the-stolen-thing-is')!;
    expect(reading.descriptiveAnswer).toBe('Gone out of town');
  });
});

describe('Is the accused person guilty (ch.129) — H4 is level, direction inconclusive', () => {
  const result = runEngine(chart, 'if-it-is-the-accused-person-that-stole')!;

  it('Method 1 (direction): H4 = Iddris, level -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'accused-person-guilty-method-1-direction')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 1 (stability) is blocked with no verdict', () => {
    const def = QUESTION_REGISTRY['if-it-is-the-accused-person-that-stole'].methods.find((m) => m.id === 'accused-person-guilty-method-1-stability')!;
    expect(def.status).toBe('needs_review');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Which accused person is the thief (ch.130) — direction inconclusive, tied dot count', () => {
  const result = runEngine(chart, 'the-thief-from-among-the-accused-people')!;

  it('Method 1 (direction): H4 level, same as chapter 129 -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'thief-among-accused-method-1-direction')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2 (directional): Umuhat and Banat both have 8 single dots -> tied, uncertain', () => {
    const m2 = result.methods.find((m) => m.method.id === 'thief-among-accused-method-2')!;
    expect(m2.verdict!.outcome).toBe('uncertain');
    expect(m2.verdict!.label).toBe('Tied dot count');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Was something buried here (ch.131) — Methods 1/2 agree, Method 3 uncertain', () => {
  const result = runEngine(chart, 'if-something-was-buried-or-has-been-buried')!;

  it('Method 1: H4/H6 not both downward -> descriptive "not-buried"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'something-buried-method-1')!;
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('not-buried');
  });

  it('Method 2: H4 good but H6 bad -> AND fails regardless of stability -> descriptive "not-buried"', () => {
    const m2 = result.methods.find((m) => m.method.id === 'something-buried-method-2')!;
    expect(m2.verdict!.outcome).toBe('descriptive');
    expect(m2.verdict!.descriptiveAnswer).toBe('not-buried');
  });

  it('Method 3: H6/H8 not both downward -> uncertain (positive-trigger-only)', () => {
    const m3 = result.methods.find((m) => m.method.id === 'something-buried-method-3')!;
    expect(m3.verdict!.outcome).toBe('uncertain');
  });

  it('Methods 1 and 2 agree -> a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree');
  });
});

describe('Is there hidden treasure here (ch.132) — all methods blocked', () => {
  const result = runEngine(chart, "if-there-s-a-hidden-treasure-gold-money")!;

  it('Methods 1 and 2: trigger figures omitted -> uncertain, excluded', () => {
    ['hidden-treasure-method-1', 'hidden-treasure-method-2'].forEach((id) => {
      const m = result.methods.find((rm) => rm.method.id === id)!;
      expect(m.method.status).toBe('uncertain');
      expect(m.verdict).toBeNull();
    });
  });

  it('Method 3 (direction): H1 = Yussif, level -> uncertain', () => {
    const m3 = result.methods.find((m) => m.method.id === 'hidden-treasure-method-3-direction')!;
    expect(m3.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m3.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('How deep is it buried (ch.133) — dot count cast out by 12s', () => {
  const result = runEngine(chart, 'how-deep-something-is-buried')!;

  it('32 single dots (H1-H15), cast out by 12s = 8 -> "arm\'s length (cubit) deep"', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('cubit');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'how-deep-something-is-buried')!;
    expect(reading.descriptiveAnswer).toBe("An arm's length (cubit) deep");
  });
});

describe('Where has the traveller gone (ch.134) — result not found in any quarter', () => {
  const result = runEngine(chart, 'where-a-traveller-has-travelled-to')!;

  it('H1+H7+H15 sum is not found in any of the chart\'s own 16 houses -> uncertain', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m1.verdict!.label).toBe('Not found in any quarter');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Did the traveller go by air, water, or land (ch.135) — element count comparison', () => {
  const result = runEngine(chart, 'if-the-traveller-has-travelled-by-air-water')!;

  it('water has the most opened houses among air/water/sand -> descriptive "water"', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('water');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
  });
});

describe('Has the traveller reached their destination (ch.136) — default negative', () => {
  const result = runEngine(chart, 'if-the-traveller-has-reached-where-he-she')!;

  it('H1 (Yussif) is not downward and does not repeat at H3/H9/H7 -> descriptive "not reached"', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('not-reached');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'if-the-traveller-has-reached-where-he-she')!;
    expect(reading.descriptiveAnswer).toBe('Not reached yet');
  });
});

describe('Is this person telling the truth (ch.137) — Method 1 uncertain, Method 2 verified', () => {
  const result = runEngine(chart, 'if-someone-is-truthful-or-not')!;

  it('Method 1: H13 = Musah, H14 = Ibrahim, neither good -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'truthful-or-not-method-1')!;
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2: same H1+H5 sum as chapter 124 Method 2, not found -> descriptive "no"', () => {
    const m2 = result.methods.find((m) => m.method.id === 'truthful-or-not-method-2')!;
    expect(m2.verdict!.outcome).toBe('descriptive');
    expect(m2.verdict!.descriptiveAnswer).toBe('no');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
  });
});

describe('Will the prisoner come out (ch.138) — both methods unaddressed by this chart', () => {
  const result = runEngine(chart, 'if-a-prisoner-will-come-out-of-prison')!;

  it('Method 1: H6 = Issah, not good -> uncertain', () => {
    const m1 = result.methods.find((m) => m.method.id === 'prisoner-come-out-method-1')!;
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2: H8 bad but H16 good, not both bad -> uncertain', () => {
    const m2 = result.methods.find((m) => m.method.id === 'prisoner-come-out-method-2')!;
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Will the prisoner be removed peacefully (ch.139) — bad and upward', () => {
  const result = runEngine(chart, 'if-the-prisoner-will-be-removed-peacefully')!;

  it('H1+H3 sum is bad and upward -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.label).toBe('Bad and upward');
  });

  it('resolves as a real unfavourable result', () => {
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('How long will the prisoner stay (ch.140) — same H1+H3 sum, upward not downward', () => {
  const result = runEngine(chart, 'how-long-the-prisoner-will-stay-in-prison')!;

  it('H1+H3 sum is upward (as chapter 139 found), not downward -> uncertain', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts -> insufficient data', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});
