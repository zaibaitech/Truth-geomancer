// Stage 4 of the engine's question coverage — Prompt 5, Kanzul Mikban
// chapters 41-60 (chapter 46 and 59 not registered, ch.56's own intention
// merged into ch.48's question, an unnumbered fragment after ch.52 not
// registered — see COVERAGE.md). Same fixture chart as the rest of the
// suite; every expected figure/outcome below was read straight off a
// printed audit run of runEngine/runReading against this exact chart
// before being relied on here — not guessed.
import { describe, expect, it } from 'vitest';
import { runEngine, runReading } from '../index';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();

describe('The person that took an item / stole something (ch.41)', () => {
  const result = runEngine(chart, 'the-person-that-took-an-item-stole-something')!;

  it('Method 1: H1 gender classification is not defined by this chapter -> needs_review, excluded', () => {
    const m1 = result.methods.find((m) => m.method.id === 'item-taker-method-1')!;
    expect(m1.method.status).toBe('needs_review');
    expect(m1.verdict).toBeNull();
  });

  it('Method 2: H6+H8 = Musah, middle-good -> uncertain (only good-downward/good-upward/bad-downward are addressed)', () => {
    const m2 = result.methods.find((m) => m.method.id === 'item-taker-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('musah');
    expect(m2.calculation!.resultFigure.qualities.fortune.value).toBe('middleGood');
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts toward a verdict -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
    const reading = runReading(chart, 'the-person-that-took-an-item-stole-something')!;
    expect(reading.isInsufficient).toBe(true);
  });
});

describe('If you will get what you want from where you are going (ch.42)', () => {
  const result = runEngine(chart, 'if-you-will-get-what-you-want-from')!;

  it('Method 1: H4+H15 = Yussif, bad -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'get-what-you-want-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('yussif');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H1+H5 = Ayuba, bad -> unfavourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'get-what-you-want-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('both methods agree unfavourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('The real behavior/character of someone you want to marry (ch.43)', () => {
  const result = runEngine(chart, 'the-real-behavior-character-or-life-of-someone')!;

  it('H3+H7+H11+H14, +H12 = Umar, bad -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('umar');
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.interpretation).toContain('bad behavior');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('If a lady or man will accept your love proposal (ch.44)', () => {
  const result = runEngine(chart, 'if-a-lady-or-man-will-accept-your')!;

  it('H7+H9+H11+H15 = Ibrahim, found elsewhere in the chart -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.interpretation).toContain('accept');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('If you will get the lost thing back (ch.45)', () => {
  const result = runEngine(chart, 'if-you-will-get-the-lost-thing-back')!;

  it('whole-chart tally: water+air (9) > fire+sand (7) -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.label).toContain('9');
    expect(m1.verdict!.label).toContain('7');
    expect(m1.verdict!.interpretation).toBe('You will get it back.');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('If a lady is pregnant or not (ch.47 + fragment) — descriptive', () => {
  const result = runEngine(chart, 'if-a-lady-is-pregnant-or-not')!;

  it('Method 1/2: H5 is Kalla Allahu, neither Mahadi nor Ibrahim -> uncertain (positive trigger only)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'lady-pregnant-method-1')!;
    const m2 = result.methods.find((m) => m.method.id === 'lady-pregnant-method-2')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('Method 3: H5+H15 = Nuhu, good and downward -> descriptive "pregnant"', () => {
    const m3 = result.methods.find((m) => m.method.id === 'lady-pregnant-method-3')!;
    expect(m3.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m3.verdict!.outcome).toBe('descriptive');
    expect(m3.verdict!.descriptiveAnswer).toBe('pregnant');
  });

  it('Method 4: H7+H10 = Ali, middle-good -> uncertain (only good/bad are addressed)', () => {
    const m4 = result.methods.find((m) => m.method.id === 'lady-pregnant-method-4')!;
    expect(m4.calculation!.resultFigure.figureId).toBe('ali');
    expect(m4.calculation!.resultFigure.qualities.fortune.value).toBe('middleGood');
    expect(m4.verdict!.outcome).toBe('uncertain');
  });

  it('resolves as a real descriptive result: the one counted method agrees with itself', () => {
    expect(result.overallResult).toBe('descriptive');
    expect(result.calculationDetails.consensus.kind).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('agree');
    const reading = runReading(chart, 'if-a-lady-is-pregnant-or-not')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Pregnant');
    expect(reading.isInsufficient).toBe(false);
  });
});

describe('If it\'s a male or female child (ch.48 + ch.56) — descriptive', () => {
  const result = runEngine(chart, 'if-it-s-a-male-or-female-child')!;

  it('Method 1/2: H1/H10+H11 gender classification not defined -> needs_review, excluded', () => {
    const m1 = result.methods.find((m) => m.method.id === 'child-gender-method-1')!;
    const m2 = result.methods.find((m) => m.method.id === 'child-gender-method-2')!;
    expect(m1.method.status).toBe('needs_review');
    expect(m1.verdict).toBeNull();
    expect(m2.method.status).toBe('needs_review');
    expect(m2.verdict).toBeNull();
  });

  it('Method 3 (from ch.56): total dots = 95, cast out by 3s = 2 -> descriptive "female"', () => {
    const m3 = result.methods.find((m) => m.method.id === 'child-gender-method-3')!;
    expect(m3.verdict!.outcome).toBe('descriptive');
    expect(m3.verdict!.descriptiveAnswer).toBe('female');
    expect(m3.verdict!.interpretation).toContain('95');
    expect(m3.verdict!.interpretation).toContain('2');
  });

  it('resolves as a real descriptive result, citing both chapter 48 and chapter 56 as sources', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'if-it-s-a-male-or-female-child')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Female');
    const chapterIds = reading.sourceReferences.map((s) => s.chapterId);
    expect(chapterIds).toContain('if-it-s-a-male-or-female-child');
    expect(chapterIds).toContain('about-a-pregnancy-if-it-s-a-boy');
  });
});

describe('If something is closer to you or far away (ch.49) — descriptive', () => {
  const result = runEngine(chart, 'if-something-is-closer-to-you-or-far')!;

  it('H5+H7+H11+H13 = Sulemana, sand element -> descriptive "far-away"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('sulemana');
    expect(m1.calculation!.resultFigure.element).toBe('sand');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('far-away');
  });

  it('ReadingResult shows the descriptive answer, not a favourable/unfavourable badge', () => {
    const reading = runReading(chart, 'if-something-is-closer-to-you-or-far')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Far away');
  });
});

describe('If you will get gold where you are working (ch.50)', () => {
  const result = runEngine(chart, 'if-you-will-get-gold-in-a-place')!;

  it('H1+H10+H11+H14 = Ayuba, sand element -> favourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.calculation!.resultFigure.element).toBe('sand');
    expect(m1.verdict!.outcome).toBe('favourable');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('favourable');
  });
});

describe('Yearly news (ch.51)', () => {
  const result = runEngine(chart, 'if-things-are-going-to-be-well-this')!;

  it('H1+H6+H10+H16 = Musah, middle-good -> uncertain (only bad / good-fire / good-downward are addressed)', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('musah');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('middleGood');
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('The friendship between two people (ch.52)', () => {
  const result = runEngine(chart, 'the-friendship-between-two-people-if-it-s')!;

  it('H11+H15 = Sulemana, bad -> unfavourable', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('sulemana');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('overall matches the one verified method', () => {
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('If a querent is asking about someone or him/herself (ch.53) — descriptive', () => {
  const result = runEngine(chart, 'if-a-querent-is-asking-about-someone-or')!;

  it('H1+H7, upward -> descriptive "someone-else"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.qualities.direction.value).toBe('upward');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('someone-else');
  });

  it('ReadingResult shows the descriptive answer, not a favourable/unfavourable badge', () => {
    const reading = runReading(chart, 'if-a-querent-is-asking-about-someone-or')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('Asking about someone else');
  });
});

describe('Where your success is (ch.54) — descriptive', () => {
  const result = runEngine(chart, 'where-your-success-is-or-where-you-will')!;

  it('H1+H7+H4+H8 = Ali, air element -> descriptive "Western part of the world"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ali');
    expect(m1.calculation!.resultFigure.element).toBe('air');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('air');
    expect(m1.verdict!.label).toBe('Western part of the world');
  });
});

describe('The whereabouts of a thief or robbers (ch.55) — descriptive', () => {
  const result = runEngine(chart, 'the-whereabouts-of-a-thief-or-robbers')!;

  it('H1+H12, +H13 -> not found anywhere in the chart', () => {
    const m1 = result.methods[0];
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('not-found');
    expect(m1.verdict!.interpretation).toContain("isn't found anywhere in the chart");
  });

  it('ReadingResult still shows a real, successful descriptive reading, not insufficient data', () => {
    const reading = runReading(chart, 'the-whereabouts-of-a-thief-or-robbers')!;
    expect(reading.isInsufficient).toBe(false);
    expect(reading.resultKind).toBe('descriptive');
  });
});

describe('When to travel, daytime or night time (ch.57) — descriptive', () => {
  const result = runEngine(chart, 'when-to-travel-daytime-or-night-time')!;

  it('H5+H6+H7+H8 = Ibrahim, water element -> descriptive "night-time"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m1.calculation!.resultFigure.element).toBe('water');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('night-time');
  });
});

describe('If couples have had sex or not (ch.58) — descriptive, a genuine disagreement', () => {
  const result = runEngine(chart, 'if-couples-have-had-sex-or-not')!;

  it('Method 1: H7+H13, +H12 = Issah, water line opened -> descriptive "yes"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'couples-sex-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('issah');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('yes');
  });

  it('Method 2: H5+H1 = Ayuba, water line closed -> descriptive "no"', () => {
    const m2 = result.methods.find((m) => m.method.id === 'couples-sex-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m2.verdict!.outcome).toBe('descriptive');
    expect(m2.verdict!.descriptiveAnswer).toBe('no');
  });

  it('the two methods genuinely disagree ("yes" vs. "no") -> preserved as disagree, never averaged or silently picked', () => {
    expect(result.calculationDetails.consensus.kind).toBe('descriptive');
    expect(result.calculationDetails.consensus.level).toBe('disagree');
    const reading = runReading(chart, 'if-couples-have-had-sex-or-not')!;
    expect(reading.descriptiveAnswer).toBeNull();
    expect(reading.consensusLabel.toLowerCase()).toContain('disagree');
  });
});

describe('If she/he loves you or not (ch.60) — a genuine conflict, not averaged', () => {
  const result = runEngine(chart, 'if-she-he-loves-you-or-not')!;

  it('Method 1: H1+H5 = Ayuba, bad and downward -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'does-love-you-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H7 = Nuhu, good -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'does-love-you-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('a genuine conflict between the two methods is preserved as "mixed", not averaged', () => {
    expect(result.calculationDetails.consensus.level).toBe('conflict');
    expect(result.overallResult).toBe('mixed');
    const reading = runReading(chart, 'if-she-he-loves-you-or-not')!;
    expect(reading.conflictingIndicators).toBe(true);
  });
});
