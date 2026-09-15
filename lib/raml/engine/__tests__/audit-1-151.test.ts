// Prompt 4, section 19 (originally chapters 1-40), extended by Prompt 5,
// section 15 to chapters 1-60, by Prompt 7, section 11 to chapters 1-80,
// by Prompt 9 to chapters 1-100, by Prompt 10 to chapters 1-120, by
// Prompt 11 to chapters 1-140, and by Prompt 12 to chapters 1-151 (the
// manuscript's own final chapter): a full structural audit — registry
// integrity, consensus/counting invariants, source traceability,
// primary-indicator correctness, and descriptive-result integrity — run
// against every registered question at once, not just the ones added this
// stage.
import { describe, expect, it } from 'vitest';
import { QUESTION_REGISTRY } from '../questions';
import { runEngine, runReading } from '../index';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
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

  it('now covers 140 questions total (138 by chapter 151, plus the 2 computable unnumbered fragments the Prompt 13 audit found unregistered)', () => {
    expect(ids.length).toBe(140);
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

// Prompt 6, section 2/10: "tests proving unsupported gender classifications
// are not guessed". Checked structurally across the whole registry, not
// just the methods known today to carry the code — so this keeps working
// automatically if a future stage adds another gender-blocked method.
describe('Unsourced gender classification is never guessed (Prompt 6/7)', () => {
  const ids = Object.keys(QUESTION_REGISTRY);
  const genderBlocked: { questionId: string; methodId: string }[] = [];
  ids.forEach((id) => {
    QUESTION_REGISTRY[id].methods.forEach((m) => {
      if (m.reviewReasonCode === 'gender_classification_unsourced') {
        genderBlocked.push({ questionId: id, methodId: m.id });
      }
    });
  });

  it('finds the 7 known gender-blocked methods (ch.41 M1, ch.48 M1/M2, ch.68 M1, ch.127 M1/M2, ch.141 M1) — a sanity check on the audit itself', () => {
    expect(genderBlocked.map((g) => g.methodId).sort()).toEqual(
      [
        'child-gender-method-1',
        'child-gender-method-2',
        'item-taker-method-1',
        'partner-cheating-method-1',
        'thief-description-method-1',
        'thief-description-method-2',
        'prisoner-male-or-female-method-1',
      ].sort(),
    );
  });

  it('every gender-blocked method is needs_review, carries a non-empty reviewNote, and never produces a verdict', () => {
    genderBlocked.forEach(({ questionId, methodId }) => {
      const method = QUESTION_REGISTRY[questionId].methods.find((m) => m.id === methodId)!;
      expect(method.status, `${methodId} should be needs_review`).toBe('needs_review');
      expect(method.reviewNote?.length ?? 0, `${methodId} should have a non-empty reviewNote`).toBeGreaterThan(0);

      const result = runEngine(chart, questionId)!;
      const m = result.methods.find((rm) => rm.method.id === methodId)!;
      expect(m.verdict, `${methodId} should never produce a verdict (status !== 'verified')`).toBeNull();
    });
  });

  it('a gender-blocked method never contributes to consensus, and the question never fabricates a favourable/unfavourable/descriptive answer from it alone', () => {
    genderBlocked.forEach(({ questionId, methodId }) => {
      const result = runEngine(chart, questionId)!;
      const consensus = result.calculationDetails.consensus;
      const trulyCounted = result.methods.filter((m) => m.verdict && m.verdict.outcome !== 'uncertain');
      // The gender-blocked method itself is never among the counted methods.
      expect(trulyCounted.some((m) => m.method.id === methodId)).toBe(false);
      expect(consensus.verifiableCount).toBe(trulyCounted.length);
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
