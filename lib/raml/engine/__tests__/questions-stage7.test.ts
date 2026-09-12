// Stage 7 of the engine's question coverage — Prompt 10, Kanzul Mikban
// chapters 101-120 (chapters 109-117 do not exist in the source's own
// hand-numbering — confirmed intentional by the manuscript's own front
// matter, not a transcription gap; ch.106 is a reference table, embedded
// inline in bodyPartInPain.ts rather than registered on its own; the
// "repeated again" sick-person-long-life fragment after ch.104 is a
// confirmed duplicate of ch.96 Method 1 and was not registered — see
// COVERAGE.md). Same fixture chart as the rest of the suite; every
// expected figure/outcome below was read straight off a printed audit run
// of runEngine/runReading against this exact chart before being relied on
// here — not guessed.
import { describe, expect, it } from 'vitest';
import { runEngine, runReading } from '../index';
import { QUESTION_REGISTRY } from '../questions';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();

describe('As a stranger, is the food from the market or home-prepared (ch.101) — descriptive', () => {
  const result = runEngine(chart, 'as-a-stranger-if-the-food-you-want')!;

  it('H6+H10 = Ibrahim, found at H14/H15 (neither H6 nor H10) -> descriptive "a different house"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('different-house');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'as-a-stranger-if-the-food-you-want')!;
    expect(reading.resultKind).toBe('descriptive');
    expect(reading.descriptiveAnswer).toBe('From a different house');
  });
});

describe('If this money, work, or relationship will be stable (ch.102) — figures omitted', () => {
  const result = runEngine(chart, 'if-this-money-the-work-or-the-lady')!;

  it('Method 1: the trigger-figure list is omitted -> uncertain, no verdict', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('uncertain');
    expect(m1.verdict).toBeNull();
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
    const reading = runReading(chart, 'if-this-money-the-work-or-the-lady')!;
    expect(reading.isInsufficient).toBe(true);
  });
});

describe('If the querent is sick or not (ch.103) — a genuine conflict, not averaged', () => {
  const result = runEngine(chart, 'if-the-querent-is-sick-or-not')!;

  it('Method 1: H1+H9 = Adam, air line closed -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'querent-sick-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('adam');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H9 = Usman, fire line closed and air line opened -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'querent-sick-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('usman');
    expect(m2.verdict!.outcome).toBe('favourable');
    expect(m2.verdict!.label).toBe('Fire line closed');
  });

  it('a genuine conflict between the two methods is preserved as "mixed", not averaged', () => {
    expect(result.calculationDetails.consensus.level).toBe('conflict');
    expect(result.overallResult).toBe('mixed');
  });
});

describe('If the sickness is from human, jinn, or God (ch.104) — descriptive', () => {
  const result = runEngine(chart, 'if-the-sickness-is-from-human-jinn-or')!;

  it('H4+H5+H6+H8 = Hassan-Hussein, bad -> descriptive "from jinn"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m1.calculation!.resultFigure.qualities.fortune.value).toBe('bad');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('jinn');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'if-the-sickness-is-from-human-jinn-or')!;
    expect(reading.descriptiveAnswer).toBe('From jinn');
  });
});

describe('Which part of the body is in pain (ch.105) — descriptive, embeds ch.106\'s table', () => {
  const result = runEngine(chart, 'which-part-of-the-body-is-paining-the')!;

  it('the 4 elements of H3/H7/H10/H15, summed, resolve to Adam — found at H2 -> descriptive "Neck"', () => {
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('adam');
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.label).toBe('Neck');
  });

  it('resolves as a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'which-part-of-the-body-is-paining-the')!;
    expect(reading.descriptiveAnswer).toBe('Neck');
  });
});

describe('Will I see what I am searching for (ch.107, Nazir) — constant figure undefined', () => {
  const result = runEngine(chart, 'if-you-will-see-what-you-are-searching')!;

  it('Method 1: Nazir\'s own dot-pattern is never defined -> uncertain, excluded', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('uncertain');
    const def = QUESTION_REGISTRY['if-you-will-see-what-you-are-searching'].methods[0];
    expect(def.reviewReasonCode).toBe('constant_figure_undefined');
    expect(m1.verdict).toBeNull();
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Will we get to talk (ch.108, Nutik) — constant figure undefined', () => {
  const result = runEngine(chart, 'if-you-will-get-to-talk-to-someone')!;

  it('Method 1: Nutik\'s own dot-pattern is never defined -> uncertain, excluded', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('uncertain');
    const def = QUESTION_REGISTRY['if-you-will-get-to-talk-to-someone'].methods[0];
    expect(def.reviewReasonCode).toBe('constant_figure_undefined');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Will I get what I am searching for, in this place (ch.118, Itisal) — constant figure undefined', () => {
  const result = runEngine(chart, 'if-you-will-get-what-you-are-searching')!;

  it('Method 1: Itisal\'s own dot-pattern is never defined -> uncertain, excluded', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('uncertain');
    const def = QUESTION_REGISTRY['if-you-will-get-what-you-are-searching'].methods[0];
    expect(def.reviewReasonCode).toBe('constant_figure_undefined');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('What will block me (ch.119, Ifusal) — constant figure undefined', () => {
  const result = runEngine(chart, 'if-you-won-t-get-what-you-are')!;

  it('Method 1: Ifusal\'s own dot-pattern is never defined -> uncertain, excluded', () => {
    const m1 = result.methods[0];
    expect(m1.method.status).toBe('uncertain');
    const def = QUESTION_REGISTRY['if-you-won-t-get-what-you-are'].methods[0];
    expect(def.reviewReasonCode).toBe('constant_figure_undefined');
  });

  it('no method counts -> insufficient data, honestly', () => {
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Do I have enemies, and how many (ch.120) — descriptive', () => {
  const result = runEngine(chart, 'if-you-have-enemies-and-how-many')!;

  it('Method 1: Nuhu found once in the chart (H7) -> descriptive "1 enemy"', () => {
    const m1 = result.methods.find((m) => m.method.id === 'enemies-how-many-method-1')!;
    expect(m1.verdict!.outcome).toBe('descriptive');
    expect(m1.verdict!.descriptiveAnswer).toBe('1');
    expect(m1.verdict!.label).toBe('1 enemy');
  });

  it('Method 2: H12 = Sulemana, not Musah -> uncertain (positive trigger only)', () => {
    const m2 = result.methods.find((m) => m.method.id === 'enemies-how-many-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('sulemana');
    expect(m2.verdict!.outcome).toBe('uncertain');
  });

  it('only Method 1 counts -> a real descriptive result', () => {
    expect(result.overallResult).toBe('descriptive');
    const reading = runReading(chart, 'if-you-have-enemies-and-how-many')!;
    expect(reading.descriptiveAnswer).toBe('1 enemy');
  });
});
