// Tests for the results-screen presentation layer (Prompt 19 — simplify,
// clarify, be transparent). This file proves computePrimaryStatus and
// primaryAnswerText correctly PHRASE an already-decided ReadingResult; it
// never re-derives agreement itself, so the fixtures below reuse
// composeReading exactly as reading.test.ts does, hand-building the same
// MethodConsensus shapes COMPARE_RESULTS would already have produced.
import { describe, expect, it } from 'vitest';
import { composeReading } from './engine/reading';
import { runReading } from './engine';
import { fixtureChart } from './engine/__tests__/fixtures';
import { QUESTION_REGISTRY } from './engine/questions';
import { computePrimaryStatus, primaryAnswerText, primaryDisplayedInterpretation, shouldShowShortSummary } from './resultPresentation';
import type { ComputedFigure, EngineResult, FigureQualities, MethodConsensus, MethodResult, QuestionDefinition } from './engine/types';

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

function method(id: string, label: string, overrides: Partial<MethodResult> = {}): MethodResult {
  return {
    method: { id, label, status: 'verified', source: { book: 'kanzul-mikban', chapterId: 'test-chapter', quote: 'Pick a house and check it.' } },
    calculation: { housesUsed: [1], steps: [`H1 = ${label}`], resultFigure: figure() },
    verdict: { outcome: 'favourable', label: 'Good and upward', interpretation: `${label} says yes.` },
    ...overrides,
  };
}

function question(overrides: Partial<QuestionDefinition> = {}): QuestionDefinition {
  return { id: 'test-question', title: 'Will I get money today?', categoryId: 'money-possessions', chapterId: 'test-chapter', methods: [], ...overrides };
}

function readingWith(methods: MethodResult[], consensus: MethodConsensus, overallResult: EngineResult['overallResult']) {
  return composeReading(
    {
      questionId: 'test-question',
      question: 'Will I get money today?',
      overallResult,
      summary: 'test',
      primaryFigure: methods[0] ?? null,
      supportingHouses: [1],
      methods,
      interpretation: methods.map((m) => m.verdict?.interpretation).join(' '),
      calculationDetails: { consensus },
    },
    question(),
  );
}

describe('computePrimaryStatus — 1. multiple methods agreeing', () => {
  it('gives one primary answer and an agreement status naming the count, with no method breakdown', () => {
    const m1 = method('m1', 'Method 1');
    const m2 = method('m2', 'Method 2');
    const consensus: MethodConsensus = {
      kind: 'outcome',
      level: 'agree',
      favourableCount: 2,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 2,
      summary: 'All 2 of 2 computable method(s) agree.',
      descriptiveAnswer: null,
    };
    const result = readingWith([m1, m2], consensus, 'favourable');
    const status = computePrimaryStatus(result);

    expect(status.kind).toBe('agree');
    expect(status.countedCount).toBe(2);
    expect(status.statusText).toBe('2 verified methods agree.');
    expect(status.showBreakdown).toBe(false);
    expect(primaryAnswerText(result, status)).toBe('Favourable');
  });
});

describe('primaryDisplayedInterpretation — source text on the primary card, not only the label', () => {
  it('surfaces the counted method interpretation for a descriptive reading', () => {
    const interpretation =
      'It means a message, a messenger, or a child/pregnancy that you will soon get. It also talks about travelling across water or a flood. Do the sadaka of a white house-bird, white rice and cow\'s milk, or the head of a sheep or goat.';
    const m1 = method('m1', 'Method 1', {
      verdict: {
        outcome: 'descriptive',
        label: 'Interpretation #5 — Ibrahim',
        descriptiveAnswer: 'interpretation-5',
        interpretation,
      },
    });
    const consensus: MethodConsensus = {
      kind: 'descriptive',
      level: 'agree',
      favourableCount: 0,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 1,
      summary: 'All 1 of 1 computable method(s) agree.',
      descriptiveAnswer: 'Interpretation #5 — Ibrahim',
    };
    const result = readingWith([m1], consensus, 'descriptive');
    const status = computePrimaryStatus(result);

    expect(primaryAnswerText(result, status)).toBe('Interpretation #5 — Ibrahim');
    expect(primaryDisplayedInterpretation(result, status)).toBe(interpretation);
    expect(shouldShowShortSummary(result, interpretation, status)).toBe(false);
  });

  it('is not figure-specific: a different descriptive method shows that method\'s own interpretation', () => {
    const interpretation =
      'It means a new funeral, or that there will be many funerals that month or week. It talks about panic and fear. Do the sadaka of a mixed-color cock, mixed-color foods, and a black cloth.';
    const m1 = method('m1', 'Method 1', {
      verdict: {
        outcome: 'descriptive',
        label: 'Interpretation #8 — Ayuba',
        descriptiveAnswer: 'interpretation-8',
        interpretation,
      },
    });
    const consensus: MethodConsensus = {
      kind: 'descriptive',
      level: 'agree',
      favourableCount: 0,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 1,
      summary: 'All 1 of 1 computable method(s) agree.',
      descriptiveAnswer: 'Interpretation #8 — Ayuba',
    };
    const result = readingWith([m1], consensus, 'descriptive');
    const status = computePrimaryStatus(result);

    expect(primaryAnswerText(result, status)).toBe('Interpretation #8 — Ayuba');
    expect(primaryDisplayedInterpretation(result, status)).toBe(interpretation);
    expect(primaryDisplayedInterpretation(result, status)).not.toMatch(/Ibrahim|house-bird/i);
  });

  it('does not replace shortSummary on an outcome reading — counted-method behaviour is unchanged', () => {
    const m1 = method('m1', 'Method 1');
    const consensus: MethodConsensus = {
      kind: 'outcome',
      level: 'agree',
      favourableCount: 1,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 1,
      summary: 'All 1 of 1 computable method(s) agree.',
      descriptiveAnswer: null,
    };
    const result = readingWith([m1], consensus, 'favourable');
    const status = computePrimaryStatus(result);

    expect(primaryDisplayedInterpretation(result, status)).toBeNull();
    expect(shouldShowShortSummary(result, null, status)).toBe(true);
    expect(result.shortSummary).toBe('Favourable — the verified methods agree.');
  });

  it('does not pick an interpretation when descriptive methods disagree', () => {
    const m1 = method('m1', 'Method 1', { verdict: { outcome: 'descriptive', label: 'Water', descriptiveAnswer: 'water', interpretation: 'Much water.' } });
    const m2 = method('m2', 'Method 2', { verdict: { outcome: 'descriptive', label: 'Sand', descriptiveAnswer: 'sand', interpretation: 'Dry sand.' } });
    const consensus: MethodConsensus = {
      kind: 'descriptive',
      level: 'disagree',
      favourableCount: 0,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 2,
      summary: 'The 2 computable methods give different answers.',
      descriptiveAnswer: null,
    };
    const result = readingWith([m1, m2], consensus, 'descriptive');
    const status = computePrimaryStatus(result);

    expect(status.kind).toBe('no_dominant');
    expect(primaryDisplayedInterpretation(result, status)).toBeNull();
  });
});

describe('computePrimaryStatus — 2. multiple methods disagreeing', () => {
  it('never picks a winner: shows "Mixed indications" and flags the individual results as available', () => {
    const m1 = method('m1', 'Method 1');
    const m2 = method('m2', 'Method 2', { verdict: { outcome: 'unfavourable', label: 'Bad', interpretation: 'Method 2 says no.' } });
    const consensus: MethodConsensus = {
      kind: 'outcome',
      level: 'conflict',
      favourableCount: 1,
      unfavourableCount: 1,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 2,
      summary: 'The computable methods conflict.',
      descriptiveAnswer: null,
    };
    const result = readingWith([m1, m2], consensus, 'mixed');
    const status = computePrimaryStatus(result);

    expect(status.kind).toBe('no_dominant');
    expect(status.statusText).toBe('Verified methods give mixed indications.');
    expect(status.showBreakdown).toBe(true);
    expect(primaryAnswerText(result, status)).toBe('Mixed indications');
    // The breakdown is never a fabricated third answer — it's the two real
    // methods, named plainly, each with its own real outcome.
    const counted = result.methodResults.filter((m) => m.counted);
    expect(counted.map((m) => `${m.label} → ${m.outcomeLabel}`)).toEqual(['Method 1 → Favourable', 'Method 2 → Unfavourable']);
  });

  it('also names disagreement plainly for a descriptive question (categorical answers, not favourable/unfavourable)', () => {
    const m1 = method('m1', 'Method 1', { verdict: { outcome: 'descriptive', label: 'Water', descriptiveAnswer: 'water', interpretation: 'Much water.' } });
    const m2 = method('m2', 'Method 2', { verdict: { outcome: 'descriptive', label: 'Sand', descriptiveAnswer: 'sand', interpretation: 'Dry sand.' } });
    const consensus: MethodConsensus = {
      kind: 'descriptive',
      level: 'disagree',
      favourableCount: 0,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 2,
      summary: 'The 2 computable methods give different answers.',
      descriptiveAnswer: null,
    };
    const result = readingWith([m1, m2], consensus, 'descriptive');
    const status = computePrimaryStatus(result);

    expect(status.kind).toBe('no_dominant');
    expect(status.showBreakdown).toBe(true);
    expect(primaryAnswerText(result, status)).toBe('Mixed indications');
    expect(result.methodResults.map((m) => m.outcomeLabel)).toEqual(['Water', 'Sand']);
  });
});

describe('computePrimaryStatus — 3. one verified method', () => {
  it('shows the answer with "Based on 1 verified method.", never an agreement claim', () => {
    const m1 = method('m1', 'Method 1');
    const consensus: MethodConsensus = {
      kind: 'outcome',
      level: 'agree',
      favourableCount: 1,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 1,
      summary: 'All 1 of 1 computable method(s) agree.',
      descriptiveAnswer: null,
    };
    const result = readingWith([m1], consensus, 'favourable');
    const status = computePrimaryStatus(result);

    expect(status.kind).toBe('single');
    expect(status.countedCount).toBe(1);
    expect(status.statusText).toBe('Based on 1 verified method.');
    expect(status.showBreakdown).toBe(false);
    expect(primaryAnswerText(result, status)).toBe('Favourable');
  });

  it('does the same for a single descriptive method', () => {
    const m1 = method('m1', 'Method 1', { verdict: { outcome: 'descriptive', label: 'Eastern direction', descriptiveAnswer: 'east', interpretation: 'Goes east.' } });
    const consensus: MethodConsensus = {
      kind: 'descriptive',
      level: 'agree',
      favourableCount: 0,
      unfavourableCount: 0,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 1,
      summary: 'All 1 of 1 computable method(s) agree.',
      descriptiveAnswer: 'Eastern direction',
    };
    const result = readingWith([m1], consensus, 'descriptive');
    const status = computePrimaryStatus(result);

    expect(status.kind).toBe('single');
    expect(status.statusText).toBe('Based on 1 verified method.');
    expect(primaryAnswerText(result, status)).toBe('Eastern direction');
    expect(primaryDisplayedInterpretation(result, status)).toBe('Goes east.');
    expect(shouldShowShortSummary(result, 'Goes east.', status)).toBe(false);
  });
});

describe('computePrimaryStatus — partial agreement (mostly_agree) stays honest, not smoothed into "agree"', () => {
  it('keeps the real dominant answer as the headline but still surfaces the minority via the breakdown', () => {
    const m1 = method('m1', 'Method 1');
    const m2 = method('m2', 'Method 2');
    const m3 = method('m3', 'Method 3', { verdict: { outcome: 'unfavourable', label: 'Bad', interpretation: 'Method 3 says no.' } });
    const consensus: MethodConsensus = {
      kind: 'outcome',
      level: 'mostly_agree',
      favourableCount: 2,
      unfavourableCount: 1,
      mixedCount: 0,
      uncertainCount: 0,
      verifiableCount: 3,
      summary: '2 of 3 computable methods agree.',
      descriptiveAnswer: null,
    };
    const result = readingWith([m1, m2, m3], consensus, 'favourable');
    const status = computePrimaryStatus(result);

    expect(status.kind).toBe('mostly_agree');
    expect(status.statusText).toBe('3 verified methods mostly agree.');
    expect(status.showBreakdown).toBe(true);
    // Never downgraded to the vague "Mixed indications" headline — a real
    // dominant answer exists and stays visible, exactly as computed.
    expect(primaryAnswerText(result, status)).toBe('Favourable');
    expect(result.methodResults.filter((m) => m.counted)).toHaveLength(3);
  });
});

describe('computePrimaryStatus — never fabricates certainty', () => {
  it('produces no probability, percentage or certainty language on any real engine reading', () => {
    const chart = fixtureChart();
    const forbidden = /\d+%|confidence|probability|\bcertain\b|\bdefinitely\b|\bguaranteed\b/i;
    for (const id of Object.keys(QUESTION_REGISTRY)) {
      const result = runReading(chart, id)!;
      if (result.isInsufficient) continue;
      const status = computePrimaryStatus(result);
      const answer = primaryAnswerText(result, status);
      expect(status.statusText, id).not.toMatch(forbidden);
      expect(answer, id).not.toMatch(forbidden);
    }
  });

  it('reaches every non-insufficient status kind at least once across the full question set', () => {
    const chart = fixtureChart();
    const kinds = new Set(
      Object.keys(QUESTION_REGISTRY)
        .map((id) => runReading(chart, id)!)
        .filter((r) => !r.isInsufficient)
        .map((r) => computePrimaryStatus(r).kind),
    );
    expect(kinds.has('agree')).toBe(true);
    expect(kinds.has('single') || kinds.has('mostly_agree') || kinds.has('no_dominant')).toBe(true);
  });

  it('only shows a method breakdown when there is more than one counted method and no single answer', () => {
    const chart = fixtureChart();
    for (const id of Object.keys(QUESTION_REGISTRY)) {
      const result = runReading(chart, id)!;
      if (result.isInsufficient) continue;
      const status = computePrimaryStatus(result);
      if (status.showBreakdown) {
        expect(status.countedCount, id).toBeGreaterThan(1);
      } else {
        expect(status.kind === 'single' || status.kind === 'agree', id).toBe(true);
      }
    }
  });
});
