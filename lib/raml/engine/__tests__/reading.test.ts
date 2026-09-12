// Tests for the reading composition layer (Prompt 3). These build EngineResult
// objects by hand — the same style operations.test.ts uses for MethodResult —
// so composeReading's OWN logic is tested in isolation from COMPARE_RESULTS
// (already covered in operations.test.ts) and from any particular chart.
// A handful of integration tests at the bottom run the real engine on the
// existing fixture chart to prove the wiring holds end to end.
import { describe, expect, it } from 'vitest';
import { composeReading } from '../reading';
import { runReading } from '../index';
import { fixtureChart } from './fixtures';
import type { ComputedFigure, EngineResult, FigureQualities, MethodResult, QuestionDefinition } from '../types';

function qualities(overrides: Partial<FigureQualities> = {}): FigureQualities {
  return {
    fortune: { value: 'good', status: 'verified', source: { kind: 'classical-tradition' } },
    direction: { value: 'upward', status: 'verified', source: { kind: 'classical-tradition' } },
    lineStates: { fire: 'opened', air: 'opened', water: 'closed', sand: 'opened' },
    stability: { value: null, status: 'needs_review', source: { kind: 'unsourced', note: 'not sourced anywhere' } },
    gender: { value: null, status: 'needs_review', source: { kind: 'unsourced', note: 'not sourced anywhere' } },
    dayNight: { value: null, status: 'needs_review', source: { kind: 'unsourced', note: 'not sourced anywhere' } },
    ...overrides,
  };
}

function figure(overrides: Partial<ComputedFigure> = {}): ComputedFigure {
  return {
    figureId: 'yussif',
    figureName: 'Yussif',
    classicalName: 'Via',
    dotPattern: [1, 1, 2, 1],
    element: 'fire',
    qualities: qualities(),
    sourceHouses: [1],
    ...overrides,
  };
}

function method(overrides: Partial<MethodResult> = {}): MethodResult {
  return {
    method: { id: 'm1', label: 'Method 1', status: 'verified', source: { book: 'kanzul-mikban', chapterId: 'test-chapter', quote: 'Pick h1 and check it.' } },
    calculation: { housesUsed: [1], steps: ['H1 = Yussif'], resultFigure: figure() },
    verdict: { outcome: 'favourable', label: 'Good and upward', interpretation: 'You will get money today.' },
    ...overrides,
  };
}

function engineResult(overrides: Partial<EngineResult> = {}): EngineResult {
  return {
    questionId: 'test-question',
    question: 'Will I get money today?',
    overallResult: 'favourable',
    summary: 'Favourable — every computable method for this question agrees.',
    primaryFigure: null,
    supportingHouses: [1],
    methods: [],
    interpretation: 'Method 1: You will get money today.',
    calculationDetails: {
      consensus: { level: 'agree', favourableCount: 1, unfavourableCount: 0, mixedCount: 0, uncertainCount: 0, verifiableCount: 1, summary: 'All 1 of 1 computable method(s) agree.' },
    },
    ...overrides,
  };
}

function question(overrides: Partial<QuestionDefinition> = {}): QuestionDefinition {
  return { id: 'test-question', title: 'Will I get money today?', categoryId: 'money-possessions', chapterId: 'test-chapter', methods: [], ...overrides };
}

describe('composeReading — favourable result', () => {
  it('surfaces the outcome, primary figure and full audit trail without altering any value', () => {
    const m = method();
    const result = composeReading(engineResult({ methods: [m], primaryFigure: m }), question());

    expect(result.overallOutcome).toBe('favourable');
    expect(result.outcomeLabel).toBe('Favourable');
    expect(result.isInsufficient).toBe(false);
    expect(result.shortSummary).toBe('Favourable — every computable method for this question agrees.'); // unchanged pass-through
    expect(result.detailedInterpretation).toBe('Method 1: You will get money today.'); // unchanged pass-through
    expect(result.primaryFigure).toMatchObject({ role: 'primary', figureName: 'Yussif', fortune: 'Good', direction: 'Upward', element: 'Fire' });
    expect(result.methodResults[0]).toMatchObject({ agreesWithOverall: true, outcome: 'favourable', outcomeLabel: 'Favourable' });
    expect(result.sourceStatus).toBe('all_verified');
    expect(result.verificationNotice).toBeNull();
  });
});

describe('composeReading — unfavourable result', () => {
  it('mirrors the favourable case for the opposite outcome', () => {
    const m = method({ verdict: { outcome: 'unfavourable', label: 'Bad', interpretation: 'You will not get money.' } });
    const result = composeReading(engineResult({ overallResult: 'unfavourable', methods: [m], primaryFigure: m }), question());

    expect(result.overallOutcome).toBe('unfavourable');
    expect(result.outcomeLabel).toBe('Unfavourable');
    expect(result.methodResults[0].agreesWithOverall).toBe(true);
  });
});

describe('composeReading — mostly favourable (section 11 example)', () => {
  it('shows 2 favourable, 1 unfavourable with a check/cross per method and a disagreement note', () => {
    const m1 = method({ method: { ...method().method, id: 'm1', label: 'Method 1' } });
    const m2 = method({ method: { ...method().method, id: 'm2', label: 'Method 2' } });
    const m3 = method({
      method: { ...method().method, id: 'm3', label: 'Method 3' },
      verdict: { outcome: 'unfavourable', label: 'Bad', interpretation: 'You will not get money.' },
    });
    const consensus = { level: 'mostly_agree' as const, favourableCount: 2, unfavourableCount: 1, mixedCount: 0, uncertainCount: 0, verifiableCount: 3, summary: '2 of 3 computable methods agree.' };
    const result = composeReading(
      engineResult({ overallResult: 'favourable', methods: [m1, m2, m3], primaryFigure: m1, calculationDetails: { consensus } }),
      question(),
    );

    expect(result.consensusBreakdown).toBe('2 favourable, 1 unfavourable');
    expect(result.disagreementNote).toBe('One method gives a different indication.');
    expect(result.methodResults.map((r) => r.agreesWithOverall)).toEqual([true, true, false]);
    expect(result.conflictingIndicators).toBe(false);
  });
});

describe('composeReading — conflicting methods', () => {
  it('never averages a genuine conflict into a fabricated middle result', () => {
    const fav = method({ method: { ...method().method, id: 'm1' } });
    const unfav = method({
      method: { ...method().method, id: 'm2' },
      verdict: { outcome: 'unfavourable', label: 'Bad', interpretation: 'You will not get money.' },
    });
    const consensus = { level: 'conflict' as const, favourableCount: 1, unfavourableCount: 1, mixedCount: 0, uncertainCount: 0, verifiableCount: 2, summary: 'The computable methods conflict.' };
    // ruleEngine.deriveOverallResult forces 'mixed' on a genuine conflict rather than picking a side.
    const result = composeReading(
      engineResult({ overallResult: 'mixed', methods: [fav, unfav], primaryFigure: fav, calculationDetails: { consensus } }),
      question(),
    );

    expect(result.overallOutcome).toBe('mixed');
    expect(result.conflictingIndicators).toBe(true);
    expect(result.disagreementNote).toBe(
      'The traditional methods for this question genuinely disagree — this is preserved as-is, not resolved into a single answer.',
    );
    // Neither side's own outcome literally equals the disclosed 'mixed' label — both are honestly marked as not agreeing with it.
    expect(result.methodResults.map((r) => r.agreesWithOverall)).toEqual([false, false]);
  });
});

describe('composeReading — insufficient verified data', () => {
  it('shows the exact required copy and no outcome, primary figure, or interpretation content', () => {
    const uncertainMethod: MethodResult = {
      method: { id: 'm1', label: 'Method 1', status: 'uncertain', reviewNote: 'Named figures were not transcribed.', source: { book: 'kanzul-mikban', chapterId: 'test-chapter', quote: 'Check the figures below: [omitted]' } },
      calculation: null,
      verdict: null,
    };
    const consensus = { level: 'insufficient_data' as const, favourableCount: 0, unfavourableCount: 0, mixedCount: 0, uncertainCount: 1, verifiableCount: 0, summary: 'None of this question’s methods could be computed with confidence for this chart.' };
    const result = composeReading(
      engineResult({ overallResult: 'insufficient_data', methods: [uncertainMethod], primaryFigure: null, calculationDetails: { consensus } }),
      question(),
    );

    expect(result.isInsufficient).toBe(true);
    expect(result.outcomeLabel).toBe('Insufficient Verified Data');
    expect(result.shortSummary).toBe('We could not produce a reliable automatic reading from the currently verified source rules.');
    expect(result.primaryFigure).toBeNull();
    expect(result.sourceStatus).toBe('none_verified');
    expect(result.methodResults[0]).toMatchObject({ status: 'uncertain', outcome: null, agreesWithOverall: null, reviewNote: 'Named figures were not transcribed.' });
  });
});

describe('composeReading — needs_review methods', () => {
  it('shows a needs_review method with its houses/steps but no verdict, and the exact partial-verification notice', () => {
    const verified = method();
    const needsReview: MethodResult = {
      method: { id: 'm2', label: 'Method 2', status: 'needs_review', reviewNote: 'The rule never says what a split result means.', source: { book: 'kanzul-mikban', chapterId: 'test-chapter', quote: 'Check H2 and H6.' } },
      calculation: { housesUsed: [2, 6], steps: ['H2 = Adam', 'H6 = Issah'], resultFigure: figure({ figureId: 'issah', figureName: 'Issah', sourceHouses: [6] }) },
      verdict: null,
    };
    const result = composeReading(engineResult({ methods: [verified, needsReview], primaryFigure: verified }), question());

    const row = result.methodResults[1];
    expect(row.status).toBe('needs_review');
    expect(row.outcome).toBeNull();
    expect(row.agreesWithOverall).toBeNull();
    expect(row.reviewNote).toBe('The rule never says what a split result means.');
    expect(row.housesUsed).toEqual([2, 6]);
    expect(row.calculationSteps).toEqual(['H2 = Adam', 'H6 = Issah']);
    expect(result.sourceStatus).toBe('partially_verified');
    expect(result.verificationNotice).toBe('Some additional traditional methods could not be evaluated because their source material requires verification.');
  });
});

describe('composeReading — a VERIFIED method whose own outcome is "uncertain"', () => {
  it('is never counted toward Method Consistency, even though it produced a real verdict', () => {
    // Real example: a chart falling outside every branch a verified rule
    // defines (e.g. "good+upward, good+downward, or bad" — nothing else)
    // legitimately returns verdict.outcome: 'uncertain'. COMPARE_RESULTS
    // already excludes this from the tally; composeReading must not turn
    // it back into a check/cross row.
    const fav = method({ method: { ...method().method, id: 'm1' } });
    const outsideAllBranches: MethodResult = {
      method: { id: 'm2', label: 'Method 2', status: 'verified', source: { book: 'kanzul-mikban', chapterId: 'test-chapter', quote: 'quote' } },
      calculation: { housesUsed: [4], steps: ['H4 = Iddris'], resultFigure: figure({ figureId: 'iddris', figureName: 'Iddris', sourceHouses: [4] }) },
      verdict: { outcome: 'uncertain', label: 'Outside defined branches', interpretation: 'This chart falls outside every branch this rule defines.' },
    };
    const consensus = { level: 'agree' as const, favourableCount: 1, unfavourableCount: 0, mixedCount: 0, uncertainCount: 1, verifiableCount: 1, summary: 'All 1 of 1 computable method(s) agree.' };
    const result = composeReading(
      engineResult({ methods: [fav, outsideAllBranches], primaryFigure: fav, calculationDetails: { consensus } }),
      question(),
    );

    expect(result.methodResults[1]).toMatchObject({ counted: false, agreesWithOverall: null, outcome: 'uncertain', outcomeLabel: 'Uncertain' });
    expect(result.methodResults[0]).toMatchObject({ counted: true, agreesWithOverall: true });
  });
});

describe('composeReading — uncertain methods (calculation itself failed)', () => {
  it('shows an uncertain method with no houses/steps/result figure, only its review note and source quote', () => {
    const verified = method();
    const uncertain: MethodResult = {
      method: { id: 'm2', label: 'Method 2', status: 'uncertain', reviewNote: 'Depends on omitted figures.', source: { book: 'kanzul-mikban', chapterId: 'test-chapter', quote: 'Check the omitted figures.' } },
      calculation: null,
      verdict: null,
    };
    const result = composeReading(engineResult({ methods: [verified, uncertain], primaryFigure: verified }), question());

    const row = result.methodResults[1];
    expect(row.housesUsed).toEqual([]);
    expect(row.calculationSteps).toEqual([]);
    expect(row.resultFigureName).toBeNull();
    expect(row.resultPattern).toBeNull();
    expect(row.reviewNote).toBe('Depends on omitted figures.');
    expect(row.sourceQuote).toBe('Check the omitted figures.');
  });
});

describe('composeReading — missing figure information', () => {
  it('never fabricates a primary figure when the engine could not compute one, even if a method record exists', () => {
    const noCalc: MethodResult = {
      method: { id: 'm1', label: 'Method 1', status: 'verified', source: { book: 'kanzul-mikban', chapterId: 'test-chapter', quote: 'quote' } },
      calculation: null,
      verdict: null,
    };
    const result = composeReading(engineResult({ methods: [noCalc], primaryFigure: noCalc }), question());
    expect(result.primaryFigure).toBeNull();
  });
});

describe('composeReading — missing optional qualities', () => {
  it('omits fortune/direction from an indicator when not verified or genuinely level, without showing "unknown"', () => {
    const unverifiedFortune = figure({
      qualities: qualities({
        fortune: { value: null, status: 'needs_review', source: { kind: 'unsourced', note: 'not tabulated' } },
        direction: { value: null, status: 'verified', source: { kind: 'classical-tradition' } }, // genuinely "level"
      }),
    });
    const m = method({ calculation: { housesUsed: [1], steps: ['H1 = Yussif'], resultFigure: unverifiedFortune } });
    const result = composeReading(engineResult({ methods: [m], primaryFigure: m }), question());

    expect(result.primaryFigure!.fortune).toBeNull();
    expect(result.primaryFigure!.direction).toBeNull();
    expect(result.primaryFigure!.element).toBe('Fire'); // still shown — this one IS always known
  });
});

describe('composeReading — source traceability', () => {
  it('resolves a real Kanzul Mikban chapter id to its chapter number', () => {
    const m = method({ method: { ...method().method, source: { book: 'kanzul-mikban', chapterId: 'if-you-want-to-know-if-you-will', quote: 'quote' } } });
    const result = composeReading(engineResult({ methods: [m], primaryFigure: m }), question());
    expect(result.sourceReferences).toEqual([{ book: 'Kanzul Mikban', chapterId: 'if-you-want-to-know-if-you-will', chapterNumber: 2, label: 'Kanzul Mikban, Chapter 2' }]);
    expect(result.methodResults[0].sourceLabel).toBe('Kanzul Mikban, Chapter 2');
  });

  it('falls back to just the book title for an unrecognized chapter id, never guessing a number', () => {
    const m = method({ method: { ...method().method, source: { book: 'kanzul-mikban', chapterId: 'not-a-real-chapter', quote: 'quote' } } });
    const result = composeReading(engineResult({ methods: [m], primaryFigure: m }), question());
    expect(result.sourceReferences[0]).toMatchObject({ chapterNumber: null, label: 'Kanzul Mikban' });
  });
});

describe('composeReading — calculation details', () => {
  it('carries every method\'s houses, steps and result figure through unchanged', () => {
    const m = method();
    const result = composeReading(engineResult({ methods: [m], primaryFigure: m }), question());
    expect(result.methodResults[0]).toMatchObject({
      housesUsed: [1],
      calculationSteps: ['H1 = Yussif'],
      resultFigureName: 'Yussif',
      resultPattern: [1, 1, 2, 1],
    });
  });
});

describe('composeReading — question-specific interpretation and category', () => {
  it('passes the already question-specific interpretation through untouched, and resolves the friendly category label', () => {
    const m = method();
    const travelInterpretation = 'Method 1: You will return safely from the trip.';
    const result = composeReading(
      engineResult({ interpretation: travelInterpretation, methods: [m], primaryFigure: m }),
      question({ categoryId: 'travel-change', title: 'Will I return from my trip?' }),
    );
    expect(result.detailedInterpretation).toBe(travelInterpretation);
    expect(result.questionCategory).toBe('Travel & Change');
  });

  it('returns null for a category id not in the curated list, rather than guessing a label', () => {
    const m = method();
    const result = composeReading(engineResult({ methods: [m], primaryFigure: m }), question({ categoryId: 'not-a-real-category' }));
    expect(result.questionCategory).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Integration — the real engine, the real question registry, the same
// fixture chart every other engine test file uses.
// ---------------------------------------------------------------------------

describe('runReading — end to end on real questions', () => {
  it('returns null for an intention outside the structured registry, same contract as runEngine', () => {
    expect(runReading(fixtureChart(), 'general')).toBeNull();
  });

  it('produces a full reading for the money question, including its one uncertain method', () => {
    const result = runReading(fixtureChart(), 'if-you-want-to-know-if-you-will');
    expect(result).not.toBeNull();
    expect(result!.methodResults).toHaveLength(4);
    expect(result!.sourceReferences).toEqual([{ book: 'Kanzul Mikban', chapterId: 'if-you-want-to-know-if-you-will', chapterNumber: 2, label: 'Kanzul Mikban, Chapter 2' }]);
    expect(result!.primaryFigure?.figureName).toBe('Yussif');
    expect(result!.sourceStatus).toBe('partially_verified');
  });

  it('honestly reports a genuine conflict for the court case question on this chart, without averaging it away', () => {
    const result = runReading(fixtureChart(), 'if-you-will-win-a-case-in-court');
    expect(result).not.toBeNull();
    expect(result!.conflictingIndicators).toBe(true);
    expect(result!.overallOutcome).toBe('mixed');
  });
});
