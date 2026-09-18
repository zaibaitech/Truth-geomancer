// Prompt 13 — the final Kanzul Mikban source-reconciliation audit, expressed
// as executable invariants rather than prose. Everything here locks in a
// conclusion the audit reached by reading the source, so that a future change
// cannot silently erode it: the book's own boundaries, the completeness of the
// chapter coverage matrix, and the accuracy of every unresolved-dependency
// label the UI shows a user.
//
// Nothing in this file asserts what any geomantic rule MEANS — only that the
// project's own record of what the source does and does not establish stays
// true.
import { describe, expect, it } from 'vitest';
import { QUESTION_REGISTRY } from '../questions';
import { KM_CHAPTERS, KM_EDITION_NOTE } from '@/lib/server/content/kanzulMikban';
import { runEngine } from '../index';
import { buildChartModel } from '../chartModel';
import { fixtureChart } from './fixtures';
import type { MethodDefinition, ReviewReasonCode } from '../types';

const chart = fixtureChart();
// A method's own calculate() takes the richer ChartModel, which runEngine
// builds internally — so tests that invoke calculate() directly need it too.
const chartModel = buildChartModel(chart);
const ALL_METHODS: { questionId: string; method: MethodDefinition }[] = Object.values(QUESTION_REGISTRY).flatMap((q) =>
  q.methods.map((method) => ({ questionId: q.id, method })),
);
const NON_VERIFIED = ALL_METHODS.filter((m) => m.method.status !== 'verified');

// ---------------------------------------------------------------------------
// 1. The source's own boundaries (Prompt 13, section 13)
// ---------------------------------------------------------------------------

describe('Kanzul Mikban source boundaries', () => {
  const numbered = KM_CHAPTERS.filter((c) => c.number !== null);
  const unnumbered = KM_CHAPTERS.filter((c) => c.number === null);

  it('has exactly 153 transcription entries — 142 numbered chapters + 11 unnumbered fragments', () => {
    expect(KM_CHAPTERS.length).toBe(153);
    expect(numbered.length).toBe(142);
    expect(unnumbered.length).toBe(11);
  });

  it('the highest numbered chapter is 151 — 153 was never a chapter number', () => {
    expect(Math.max(...numbered.map((c) => c.number as number))).toBe(151);
    expect(numbered.some((c) => (c.number as number) > 151)).toBe(false);
  });

  it('chapters 109-117 are the ONLY gap in the 1-151 numbering, and are intentional (the source says so)', () => {
    const present = new Set(numbered.map((c) => c.number as number));
    const missing: number[] = [];
    for (let n = 1; n <= 151; n++) if (!present.has(n)) missing.push(n);
    expect(missing).toEqual([109, 110, 111, 112, 113, 114, 115, 116, 117]);
  });

  it('no registered question or method ever cites a chapter outside the real source', () => {
    const knownIds = new Set(KM_CHAPTERS.map((c) => c.id));
    Object.values(QUESTION_REGISTRY).forEach((q) => {
      expect(knownIds.has(q.chapterId), `question "${q.id}" cites unknown chapter "${q.chapterId}"`).toBe(true);
      q.methods.forEach((m) => {
        expect(knownIds.has(m.source.chapterId), `method "${m.id}" cites unknown chapter "${m.source.chapterId}"`).toBe(true);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Complete coverage matrix — no chapter is silently unaccounted for
//    (Prompt 13, section 1)
// ---------------------------------------------------------------------------

/** Every numbered chapter with no registered method, and the audited reason.
 * A chapter may only be absent from the registry if it appears here. */
const NOT_REGISTERED: Record<number, string> = {
  33: 'separate casting mechanism — a "cast out by 4s" dot-line procedure that never reads the 16-house chart',
  46: 'ritual, not a reading — a talismanic practice whose diagram was omitted; no chart verdict either way',
  59: 'open-ended by design — every method is non-deterministic or not chart-derived',
  95: 'reference table, not a question — a life-stage lookup, and omitted from the transcription besides',
  106: 'reference table, not a question — its body-part lookup is embedded in chapter 105 (bodyPartInPain.ts), the chapter that cross-references it',
  // 151 was here (undefined "pair them" mechanism) until the product owner
  // obtained an author clarification of the procedure — see
  // lib/raml/engine/questions/dreamsAndInterpretations.ts's own header for
  // the full evidence and why that clarification, not this project's own
  // guess, is what makes it registered now.
};

describe('Chapter coverage matrix (every numbered chapter 1-151 is accounted for)', () => {
  const sourced = new Set<string>();
  ALL_METHODS.forEach(({ method }) => sourced.add(method.source.chapterId));
  Object.values(QUESTION_REGISTRY).forEach((q) => sourced.add(q.chapterId));

  KM_CHAPTERS.filter((c) => c.number !== null).forEach((chapter) => {
    const n = chapter.number as number;
    it(`chapter ${n} is either implemented or explicitly documented as not implemented`, () => {
      const implemented = sourced.has(chapter.id);
      const documented = Object.prototype.hasOwnProperty.call(NOT_REGISTERED, n);
      expect(
        implemented || documented,
        `chapter ${n} ("${chapter.title}") has no registered method AND no documented reason — it must not be silently uncovered`,
      ).toBe(true);
      // And the converse: a chapter listed as not-implemented must not also
      // be quietly implemented, which would make the documentation wrong.
      if (documented) expect(implemented, `chapter ${n} is documented as not implemented but IS registered`).toBe(false);
    });
  });

  it('exactly 5 numbered chapters are not implemented, each for a recorded reason', () => {
    expect(Object.keys(NOT_REGISTERED).map(Number).sort((a, b) => a - b)).toEqual([33, 46, 59, 95, 106]);
    Object.values(NOT_REGISTERED).forEach((reason) => expect(reason.length).toBeGreaterThan(20));
  });

  it('chapter 151 — the book\'s final chapter — IS registered as a question (author-clarified procedure)', () => {
    expect(QUESTION_REGISTRY['dreams-and-their-interpretations']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 3. Review-reason completeness and accuracy (Prompt 13, sections 9 + 10)
// ---------------------------------------------------------------------------

/** The only non-verified methods allowed to carry no machine-readable code:
 * each has a blocker that genuinely is not one single canonical category, so
 * labelling it with one would misdescribe it. Their free-text reviewNote —
 * which is what the UI actually shows — carries the full reason. */
const UNCODED_BY_DESIGN: Record<string, string> = {
  'business-method-3':
    'partial-interpretation ambiguity: the source defines the two extreme cases but never says what a mixed/middle-good pair means — not a total interpretation gap, so interpretation_not_stated would overstate it',
  'time-to-put-to-bed-method-2':
    'the source text is cut off mid-sentence after naming the houses to recast — a truncation, not an omitted figure list; the only occurrence in the book, below this project\'s 3-occurrence bar for minting a code',
  'kidnapper-location-method-1':
    'dual blocker: an undefined figure-to-house "own house" identity table AND omitted branch figures — restoring either alone would not make it computable, so no single code is accurate',
};

describe('Every unresolved method explains itself (UI honesty)', () => {
  it('every non-verified method carries a non-empty reviewNote — the string the UI actually shows', () => {
    NON_VERIFIED.forEach(({ questionId, method }) => {
      expect(
        (method.reviewNote ?? '').trim().length,
        `${questionId} / ${method.id} has no reviewNote, so the UI would fall back to generic "not yet verified" wording`,
      ).toBeGreaterThan(0);
    });
  });

  it('every non-verified method carries a canonical reviewReasonCode, or is a documented exception', () => {
    NON_VERIFIED.forEach(({ questionId, method }) => {
      if (method.reviewReasonCode) return;
      expect(
        Object.prototype.hasOwnProperty.call(UNCODED_BY_DESIGN, method.id),
        `${questionId} / ${method.id} has neither a reviewReasonCode nor a documented reason for lacking one`,
      ).toBe(true);
    });
  });

  it('the documented uncoded exceptions are exactly the three the audit identified', () => {
    const uncoded = NON_VERIFIED.filter(({ method }) => !method.reviewReasonCode).map(({ method }) => method.id).sort();
    expect(uncoded).toEqual(Object.keys(UNCODED_BY_DESIGN).sort());
  });

  it('no unresolved method is ever counted, and none ever produces a verdict', () => {
    NON_VERIFIED.forEach(({ questionId, method }) => {
      const result = runEngine(chart, questionId)!;
      const row = result.methods.find((m) => m.method.id === method.id)!;
      expect(row.verdict, `${method.id} is ${method.status} but produced a verdict`).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// 4. The unresolved dependencies themselves (Prompt 13, section 2)
// ---------------------------------------------------------------------------

function methodsWithCode(code: ReviewReasonCode) {
  return ALL_METHODS.filter(({ method }) => method.reviewReasonCode === code).map(({ method }) => method.id).sort();
}

describe('Unresolved source dependencies stay unresolved and correctly labelled', () => {
  it('male/female star: 7 occurrences, all blocked, none executable', () => {
    expect(methodsWithCode('gender_classification_unsourced')).toEqual(
      [
        'child-gender-method-1',
        'child-gender-method-2',
        'item-taker-method-1',
        'partner-cheating-method-1',
        'prisoner-male-or-female-method-1',
        'thief-description-method-1',
        'thief-description-method-2',
      ].sort(),
    );
  });

  it('the source itself admits no gender/day-night/stability table survives — the reason these stay unresolved', () => {
    // The book's own front matter is the authority here, not this project's
    // failure to find a table. If this sentence ever leaves the source, the
    // gender/day-night/stability decisions would need re-auditing.
    const frontMatter = KM_EDITION_NOTE.join(' ');
    expect(frontMatter).toContain('male or female');
    expect(frontMatter).toContain('no verified source defining exactly which of the sixteen named figures carries which quality');
  });

  it('stability: 7 occurrences, all blocked', () => {
    expect(methodsWithCode('stability_classification_unsourced').length).toBe(7);
  });

  it('day/night: 1 occurrence; present/past/future: 1 occurrence', () => {
    expect(methodsWithCode('day_night_classification_unsourced')).toEqual(['day-or-night-birth-method-1']);
    expect(methodsWithCode('temporal_classification_unsourced')).toEqual(['present-past-future-method-1']);
  });

  it('constant figures (Sirri Saael, Nazir, Nutik, Itisal, Ifusal): 5 occurrences, no pattern ever invented', () => {
    expect(methodsWithCode('constant_figure_undefined')).toEqual(
      [
        'conversation-will-happen-method-1',
        'get-what-searching-for-in-place-method-1',
        'money-method-4',
        'see-what-searching-for-method-1',
        'what-blocks-you-method-1',
      ].sort(),
    );
  });

  it('omitted trigger figures: 20 occurrences', () => {
    expect(methodsWithCode('figures_omitted_by_transcription').length).toBe(20);
  });

  it('whole-figure opened/closed state: 2 occurrences; chart spatial layout: 1 occurrence', () => {
    expect(methodsWithCode('whole_figure_state_undefined')).toEqual(['travel-method-3', 'wife-sex-method-1'].sort());
    expect(methodsWithCode('spatial_layout_unsupported')).toEqual(['game-winner-method-2']);
  });
});

// ---------------------------------------------------------------------------
// 5. "Calculation ran, meaning missing" is a DIFFERENT state from
//    "calculation could not run" (Prompt 13, section 4)
// ---------------------------------------------------------------------------

describe('Missing-interpretation methods still show their completed calculation', () => {
  const interpretationGaps = ALL_METHODS.filter(({ method }) => method.reviewReasonCode === 'interpretation_not_stated');

  it('there are exactly 2 of them (chapters 64 and 90)', () => {
    expect(interpretationGaps.map(({ method }) => method.id).sort()).toEqual(
      ['marriage-last-forever-method-2', 'misery-taken-away-method-1'].sort(),
    );
  });

  it('each one genuinely computes — real houses and real steps — so the UI cannot imply the calculation failed', () => {
    interpretationGaps.forEach(({ method }) => {
      const calc = method.calculate(chartModel);
      expect(calc.housesUsed.length, `${method.id} should expose the houses its calculation actually used`).toBeGreaterThan(0);
      expect(calc.steps.length, `${method.id} should expose its calculation steps`).toBeGreaterThan(0);
    });
  });

  it('by contrast, a method whose calculation cannot run at all exposes no houses', () => {
    // Chapter 142: neither its "own house" mapping nor its branch figures
    // survive, so there is nothing to show — the opposite UI state.
    const kidnapper = ALL_METHODS.find(({ method }) => method.id === 'kidnapper-location-method-1')!;
    expect(kidnapper.method.calculate(chartModel).housesUsed).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 6. Fragments and consolidated material stay traceable (Prompt 13, section 7)
// ---------------------------------------------------------------------------

describe('Unnumbered fragments and consolidated material', () => {
  it('the repeated sick-person fragment is cited by the method that actually implements it', () => {
    const q = QUESTION_REGISTRY['if-a-sick-person-has-long-life-or'];
    const m2 = q.methods.find((m) => m.id === 'sick-person-long-life-method-2')!;
    expect(m2.source.chapterId).toBe('if-a-sick-person-has-long-life-repeated');
    // ...while the question itself still belongs to chapter 96.
    expect(q.chapterId).toBe('if-a-sick-person-has-long-life-or');
  });

  it('confirmed duplicate fragments are never registered as their own questions', () => {
    // Each of these repeats a rule already implemented elsewhere; registering
    // them again would double-count the same source rule in a reading.
    ['someone-s-behavior-also-see-chapter-forty-three', 'if-a-sick-person-has-long-life-repeated-2'].forEach((id) => {
      expect(QUESTION_REGISTRY[id]).toBeUndefined();
    });
  });

  it('the two computable fragments found by this audit are now registered', () => {
    expect(QUESTION_REGISTRY['if-she-s-going-to-stay-in-the']).toBeDefined();
    expect(QUESTION_REGISTRY['the-consequence-of-friendship-between-two-people']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Final registry totals (Prompt 13, section 15)
// ---------------------------------------------------------------------------

describe('Final Kanzul Mikban totals', () => {
  // Updated post-Prompt-13 by the Chapter 151 registration (author-clarified
  // "pair them" procedure — see dreamsAndInterpretations.ts): +1 question,
  // +1 method, +1 verified.
  it('141 questions / 232 methods — 183 verified, 19 needs_review, 30 uncertain', () => {
    expect(Object.keys(QUESTION_REGISTRY).length).toBe(141);
    expect(ALL_METHODS.length).toBe(232);
    expect(ALL_METHODS.filter(({ method }) => method.status === 'verified').length).toBe(183);
    expect(ALL_METHODS.filter(({ method }) => method.status === 'needs_review').length).toBe(19);
    expect(ALL_METHODS.filter(({ method }) => method.status === 'uncertain').length).toBe(30);
  });
});
