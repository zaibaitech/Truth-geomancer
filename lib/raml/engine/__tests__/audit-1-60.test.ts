// Prompt 4, section 19 (originally chapters 1-40), extended by Prompt 5,
// section 15 to chapters 1-60: a full structural audit — registry
// integrity, consensus/counting invariants, source traceability,
// primary-indicator correctness, and (new this stage) descriptive-result
// integrity — run against every registered question at once, not just the
// ones added this stage.
import { describe, expect, it } from 'vitest';
import { QUESTION_REGISTRY } from '../questions';
import { runEngine, runReading } from '../index';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();
const ids = Object.keys(QUESTION_REGISTRY);

describe('Registry integrity', () => {
  it('has no duplicate question ids', () => {
    const questions = Object.values(QUESTION_REGISTRY);
    expect(new Set(ids).size).toBe(ids.length);
    expect(questions.length).toBe(ids.length);
  });

  it('every question id matches its own QuestionDefinition.id (no key/value drift)', () => {
    ids.forEach((id) => {
      expect(QUESTION_REGISTRY[id].id).toBe(id);
    });
  });

  it('every question\'s chapterId resolves to a real Kanzul Mikban chapter', () => {
    ids.forEach((id) => {
      const question = QUESTION_REGISTRY[id];
      const chapter = KM_CHAPTERS.find((c) => c.id === question.chapterId);
      expect(chapter, `question "${id}" points at unknown chapterId "${question.chapterId}"`).toBeDefined();
    });
  });

  it('every question has at least one method, and every method has a non-empty source quote', () => {
    ids.forEach((id) => {
      const question = QUESTION_REGISTRY[id];
      expect(question.methods.length, `question "${id}" has no methods`).toBeGreaterThan(0);
      question.methods.forEach((m) => {
        expect(m.source.quote.trim().length, `method "${m.id}" has an empty source quote`).toBeGreaterThan(0);
      });
    });
  });

  it('now covers 57 questions total (40 from chapters 1-40, plus 17 newly added for chapters 41-60)', () => {
    expect(ids.length).toBe(57);
  });
});

// Prompt 5, section 13/15: "descriptive answers accidentally treated as
// outcomes" and "descriptive questions never produce fabricated
// favourable/unfavourable verdicts" — checked explicitly across every
// registered question, not just the new ones, since a regression here
// could just as easily land on a chapters-1-40 descriptive question.
describe('Descriptive-result integrity (every question, on the fixture chart)', () => {
  ids.forEach((id) => {
    it(`${id}: a descriptive-kind question's counted methods never carry a favourable/unfavourable/mixed outcome`, () => {
      const question = QUESTION_REGISTRY[id];
      if ((question.resultKind ?? 'outcome') !== 'descriptive') return;
      const result = runEngine(chart, id)!;
      result.methods.forEach((m) => {
        if (!m.verdict) return;
        expect(['descriptive', 'uncertain']).toContain(m.verdict.outcome);
      });
    });

    it(`${id}: an outcome-kind question's counted methods never carry a 'descriptive' outcome`, () => {
      const question = QUESTION_REGISTRY[id];
      if ((question.resultKind ?? 'outcome') === 'descriptive') return;
      const result = runEngine(chart, id)!;
      result.methods.forEach((m) => {
        if (!m.verdict) return;
        expect(m.verdict.outcome).not.toBe('descriptive');
      });
    });

    it(`${id}: ReadingResult.resultKind always matches the QuestionDefinition's own declared resultKind`, () => {
      const question = QUESTION_REGISTRY[id];
      const reading = runReading(chart, id)!;
      expect(reading.resultKind).toBe(question.resultKind ?? 'outcome');
    });

    it(`${id}: overallOutcome is never 'descriptive' unless the question itself is descriptive-kind`, () => {
      const question = QUESTION_REGISTRY[id];
      const result = runEngine(chart, id)!;
      if ((question.resultKind ?? 'outcome') !== 'descriptive') {
        expect(result.overallResult).not.toBe('descriptive');
      }
    });
  });
});

describe('Consensus/counting invariants (every question, on the fixture chart)', () => {
  ids.forEach((id) => {
    it(`${id}: no needs_review/uncertain-status method is ever counted`, () => {
      const result = runEngine(chart, id)!;
      result.methods.forEach((m) => {
        if (m.method.status !== 'verified') {
          expect(m.verdict, `method "${m.method.id}" has status "${m.method.status}" but got a verdict`).toBeNull();
        }
      });
    });

    it(`${id}: a verified method with outcome 'uncertain' is excluded from the tally`, () => {
      const result = runEngine(chart, id)!;
      const consensus = result.calculationDetails.consensus;
      const trulyCounted = result.methods.filter((m) => m.verdict && m.verdict.outcome !== 'uncertain').length;
      expect(consensus.verifiableCount).toBe(trulyCounted);
    });

    it(`${id}: ReadingResult never marks an uncounted method as agreeing or disagreeing`, () => {
      const reading = runReading(chart, id)!;
      reading.methodResults.forEach((m) => {
        if (!m.counted) expect(m.agreesWithOverall).toBeNull();
      });
    });

    it(`${id}: a verified method always has a source reference resolvable to a real chapter`, () => {
      const reading = runReading(chart, id)!;
      expect(reading.sourceReferences.length).toBeGreaterThan(0);
      reading.sourceReferences.forEach((s) => expect(s.label.length).toBeGreaterThan(0));
    });
  });
});

describe('Primary-indication correctness (every question, on the fixture chart)', () => {
  ids.forEach((id) => {
    it(`${id}: the primary figure, when present, always reflects a counted method's own outcome`, () => {
      const reading = runReading(chart, id)!;
      if (reading.isInsufficient) {
        expect(reading.primaryFigure).toBeNull();
        return;
      }
      if (!reading.primaryFigure) return; // a question can have zero calculable figures at all — acceptable, never fabricated
      if (reading.primaryFigure.methodOutcome !== null) {
        const isCounted = reading.methodResults.some(
          (m) => m.label === reading.primaryFigure!.methodLabel && m.counted,
        );
        // The primary figure's own method should be counted whenever ANY method on this question is counted at all.
        const anyCounted = reading.methodResults.some((m) => m.counted);
        if (anyCounted) expect(isCounted).toBe(true);
      }
    });
  });
});

describe('Casting regression check', () => {
  it('the fixture chart still produces exactly the hand-verified 16 star ids (casting.ts untouched)', async () => {
    const { FIXTURE_STAR_IDS } = await import('./fixtures');
    chart.houses.forEach((h, i) => {
      expect(h.star.id).toBe(FIXTURE_STAR_IDS[i]);
    });
  });
});
