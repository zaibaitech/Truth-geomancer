// Prompt 14 — product/UX regression suite.
//
// Everything here answers one question: can a user discover, cast, and read
// every supported question WITHOUT the interface hiding, distorting, or
// inventing anything? The engine tests prove the rules are faithful to the
// source; these prove the product around them stays faithful to the engine.
//
// Nothing here asserts what any geomantic rule MEANS. Each test locks in a
// product behaviour that the Prompt 14 audit found broken (or found working
// and worth keeping), so a future change cannot silently undo it.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { INTENTIONS } from '@/content/intentions';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { QUESTION_REGISTRY } from './engine/questions';
import { runReading } from './engine';
import { OUTCOME_LABEL } from './engine/reading';
import type { ReadingResult } from './engine/reading';
import { fixtureChart } from './engine/__tests__/fixtures';
import { getQuestionAvailability, resolveEngineQuestionId } from './questionAvailability';
import { NO_AUTOMATIC_READING_HEADING } from './statusLanguage';

const chart = fixtureChart();
const SELECTABLE = INTENTIONS.filter((i) => i.id !== 'general');
const READINGS: ReadingResult[] = Object.keys(QUESTION_REGISTRY).map((id) => runReading(chart, id)!);
const ALL_ROWS = READINGS.flatMap((r) => r.methodResults.map((m) => ({ questionId: r.questionId, row: m })));

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '../..', relative), 'utf8');
}

// ---------------------------------------------------------------------------
// 1. Discovery — the picker and the engine describe the same product
// ---------------------------------------------------------------------------

describe('question discovery', () => {
  it('offers one selectable entry per transcription entry, each with a known disposition', () => {
    expect(SELECTABLE.length).toBe(KM_CHAPTERS.length);
    const kinds = SELECTABLE.map((i) => getQuestionAvailability(i.id).kind);
    expect(kinds.filter((k) => k === 'engine').length).toBe(141);
    expect(kinds.filter((k) => k === 'consolidated').length).toBe(5);
    expect(kinds.filter((k) => k === 'no-automatic-reading').length).toBe(7);
  });

  it('backs every entry it presents as an ordinary question with a registered engine question', () => {
    const unbacked = SELECTABLE.filter((i) => getQuestionAvailability(i.id).kind === 'engine' && !QUESTION_REGISTRY[i.id]);
    expect(unbacked.map((i) => i.id)).toEqual([]);
  });

  it('points every consolidated duplicate at a real engine question that is not itself a duplicate', () => {
    for (const intention of SELECTABLE) {
      const availability = getQuestionAvailability(intention.id);
      if (availability.kind !== 'consolidated') continue;
      const target = availability.canonicalQuestionId;
      expect(QUESTION_REGISTRY[target], `${intention.id} -> ${target}`).toBeDefined();
      expect(getQuestionAvailability(target).kind).toBe('engine');
      expect(availability.note.trim().length).toBeGreaterThan(0);
    }
  });

  it('leaves no registered question unreachable from the picker', () => {
    const reachable = new Set(SELECTABLE.map((i) => resolveEngineQuestionId(i.id)));
    const unreachable = Object.keys(QUESTION_REGISTRY).filter((id) => !reachable.has(id));
    expect(unreachable).toEqual([]);
  });

  it('never marks a registered question as having no automatic reading', () => {
    const contradictory = Object.keys(QUESTION_REGISTRY).filter(
      (id) => getQuestionAvailability(id).kind === 'no-automatic-reading',
    );
    expect(contradictory).toEqual([]);
  });

  it('gives every no-automatic-reading entry a badge and a reason a user can act on', () => {
    for (const intention of SELECTABLE) {
      const availability = getQuestionAvailability(intention.id);
      if (availability.kind !== 'no-automatic-reading') continue;
      expect(availability.badge.trim().length, intention.id).toBeGreaterThan(0);
      expect(availability.note.trim().length, intention.id).toBeGreaterThan(30);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Result kind — a categorical answer is never dressed up as a verdict
// ---------------------------------------------------------------------------

describe('result-kind presentation', () => {
  it('carries each question’s declared result kind through to the screen', () => {
    for (const reading of READINGS) {
      expect(reading.resultKind, reading.questionId).toBe(QUESTION_REGISTRY[reading.questionId].resultKind ?? 'outcome');
    }
  });

  it('never labels a descriptive answer favourable or unfavourable', () => {
    for (const reading of READINGS.filter((r) => r.resultKind === 'descriptive' && !r.isInsufficient)) {
      expect(reading.overallOutcome, reading.questionId).toBe('descriptive');
      expect(reading.outcomeLabel).toBe(OUTCOME_LABEL.descriptive);
    }
  });

  it('never attaches a categorical answer to a favourable/unfavourable question', () => {
    const wrong = READINGS.filter((r) => r.resultKind === 'outcome' && r.descriptiveAnswer !== null);
    expect(wrong.map((r) => r.questionId)).toEqual([]);
  });

  it('shows a single descriptive answer only where the counted methods actually agree', () => {
    for (const reading of READINGS.filter((r) => r.resultKind === 'descriptive')) {
      if (reading.descriptiveAnswer === null) continue;
      expect(reading.consensusLabel, reading.questionId).toBe('Methods agree');
      expect(reading.descriptiveAnswer.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Outcome states — favourable, unfavourable, mixed, conflict
// ---------------------------------------------------------------------------

describe('outcome presentation', () => {
  it('labels every overall outcome from the one shared label table', () => {
    for (const reading of READINGS) {
      expect(reading.outcomeLabel, reading.questionId).toBe(OUTCOME_LABEL[reading.overallOutcome]);
      expect(reading.shortSummary.trim().length).toBeGreaterThan(0);
    }
  });

  it('reaches favourable, unfavourable and mixed on one ordinary chart', () => {
    const seen = new Set(READINGS.map((r) => r.overallOutcome));
    expect(seen.has('favourable')).toBe(true);
    expect(seen.has('unfavourable')).toBe(true);
    expect(seen.has('mixed')).toBe(true);
    expect(seen.has('descriptive')).toBe(true);
    expect(seen.has('insufficient_data')).toBe(true);
  });

  it('states a disagreement only where counted methods genuinely point both ways', () => {
    for (const reading of READINGS.filter((r) => r.disagreementNote !== null)) {
      const counted = reading.methodResults.filter((m) => m.counted);
      expect(counted.some((m) => m.outcome === 'favourable'), reading.questionId).toBe(true);
      expect(counted.some((m) => m.outcome === 'unfavourable'), reading.questionId).toBe(true);
      expect(reading.conflictingIndicators).toBe(true);
      // A conflict is preserved, never resolved into one side.
      expect(reading.overallOutcome === 'favourable' || reading.overallOutcome === 'unfavourable').toBe(false);
    }
  });

  it('never silently drops a conflict: a conflicting reading always says so in words', () => {
    for (const reading of READINGS.filter((r) => r.conflictingIndicators)) {
      expect(reading.disagreementNote, reading.questionId).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Unresolved states — insufficient data, needs review, uncertain
// ---------------------------------------------------------------------------

describe('unresolved states explain themselves', () => {
  it('shows the insufficient-data screen only when nothing was counted', () => {
    for (const reading of READINGS.filter((r) => r.isInsufficient)) {
      expect(reading.methodResults.some((m) => m.counted), reading.questionId).toBe(false);
      expect(reading.outcomeLabel).toBe(OUTCOME_LABEL.insufficient_data);
      // That screen has its own copy; the partial-verification notice would
      // duplicate it and imply some methods did run.
      expect(reading.verificationNotice).toBeNull();
    }
  });

  it('gives every needs-review / uncertain method its own written reason', () => {
    // This is what makes InsufficientNotice's generic fallback unreachable in
    // production: every non-verified row carries real reviewNote copy.
    const silent = ALL_ROWS.filter((x) => x.row.status !== 'verified' && !x.row.reviewNote?.trim());
    expect(silent.map((x) => `${x.questionId}/${x.row.id}`)).toEqual([]);
  });

  it('never counts, scores, or check-marks a method that produced no verdict', () => {
    for (const { questionId, row } of ALL_ROWS) {
      if (row.status === 'verified') continue;
      expect(row.counted, `${questionId}/${row.id}`).toBe(false);
      expect(row.outcome).toBeNull();
      expect(row.outcomeLabel).toBeNull();
      expect(row.agreesWithOverall).toBeNull();
    }
  });

  it('explains every uncounted verified method too — a chart outside the rule’s branches', () => {
    // A verified method whose own outcome is 'uncertain' is excluded from the
    // tally. It must still tell the user why, or the row reads as a bug.
    const unexplained = ALL_ROWS.filter(
      (x) => x.row.status === 'verified' && !x.row.counted && !x.row.reviewNote?.trim() && !x.row.interpretation?.trim(),
    );
    expect(unexplained.map((x) => `${x.questionId}/${x.row.id}`)).toEqual([]);
  });

  it('marks agreement only on rows that were actually tallied against a verdict', () => {
    // Descriptive rows are compared by answer value, not by outcome type, so
    // Method Consistency deliberately renders them without a check or cross —
    // agreesWithOverall stays null there even though the row was counted.
    for (const { questionId, row } of ALL_ROWS) {
      const eligible = row.counted && row.outcome !== 'descriptive';
      if (!eligible) expect(row.agreesWithOverall, `${questionId}/${row.id}`).toBeNull();
    }
    const marked = ALL_ROWS.filter((x) => x.row.agreesWithOverall !== null);
    expect(marked.length).toBeGreaterThan(0);
    expect(marked.every((x) => x.row.counted)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Attribution and evidence — the user can always check the work
// ---------------------------------------------------------------------------

describe('source attribution and method evidence', () => {
  it('attributes every reading to at least one named chapter', () => {
    for (const reading of READINGS) {
      expect(reading.sourceReferences.length, reading.questionId).toBeGreaterThan(0);
      for (const ref of reading.sourceReferences) {
        expect(ref.book.trim().length).toBeGreaterThan(0);
        expect(ref.label.trim().length).toBeGreaterThan(0);
        if (ref.chapterNumber !== null) expect(ref.label).toContain(String(ref.chapterNumber));
      }
    }
  });

  it('quotes the source on every method row', () => {
    const unquoted = ALL_ROWS.filter((x) => !x.row.sourceQuote.trim() || !x.row.sourceLabel.trim());
    expect(unquoted.map((x) => `${x.questionId}/${x.row.id}`)).toEqual([]);
  });

  it('shows the houses or the working behind every counted method', () => {
    const opaque = ALL_ROWS.filter(
      (x) => x.row.counted && x.row.housesUsed.length === 0 && x.row.calculationSteps.length === 0,
    );
    expect(opaque.map((x) => `${x.questionId}/${x.row.id}`)).toEqual([]);
  });

  it('warns about unverified material exactly when some — not all — of it ran', () => {
    for (const reading of READINGS) {
      const expected = reading.sourceStatus === 'partially_verified' && !reading.isInsufficient;
      expect(reading.verificationNotice !== null, reading.questionId).toBe(expected);
    }
  });

  it('derives sourceStatus from the methods themselves', () => {
    for (const reading of READINGS) {
      // A reading that produced no verdict at all is 'none_verified' whatever
      // its method statuses say — including the case where every method is
      // verified but this particular chart fell outside all their branches.
      const expected = reading.isInsufficient
        ? 'none_verified'
        : reading.methodResults.every((m) => m.status === 'verified')
          ? 'all_verified'
          : 'partially_verified';
      expect(reading.sourceStatus, reading.questionId).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Multiple methods — agreement and conflict are both spelled out
// ---------------------------------------------------------------------------

describe('multi-method presentation', () => {
  it('writes a full-sentence agreement summary whenever two or more methods were tallied', () => {
    for (const reading of READINGS.filter((r) => r.resultKind === 'outcome')) {
      if (reading.methodResults.filter((m) => m.counted).length < 2) continue;
      expect(reading.consensusSentence, reading.questionId).not.toBeNull();
      expect(reading.consensusSentence!.trim().length).toBeGreaterThan(0);
      // Section 9: never a bare tally.
      expect(reading.consensusSentence).toMatch(/method/i);
    }
  });

  it('names the consensus level on every reading', () => {
    for (const reading of READINGS) {
      expect(reading.consensusLabel.trim().length, reading.questionId).toBeGreaterThan(0);
    }
  });

  it('covers agreement, partial agreement and conflict on one ordinary chart', () => {
    const labels = new Set(READINGS.map((r) => r.consensusLabel));
    expect(labels.has('Methods agree')).toBe(true);
    expect(labels.has('Methods mostly agree')).toBe(true);
    expect(labels.has('Methods conflict')).toBe(true);
    expect(labels.has('Methods disagree')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. No hidden inputs — the chart is the only thing a reading depends on
// ---------------------------------------------------------------------------

describe('readings depend on nothing but the chart', () => {
  it('produces an identical reading for the same chart twice', () => {
    for (const id of Object.keys(QUESTION_REGISTRY)) {
      expect(runReading(chart, id), id).toEqual(runReading(chart, id));
    }
  });

  it('uses no clock and no randomness anywhere in the engine', () => {
    // The UI collects only a chart and an optional free-text question, so a
    // reading that consulted the date or a random number would be showing the
    // user something they cannot reproduce or check.
    const engineDir = path.resolve(__dirname, 'engine');
    const files = readFileSync(path.resolve(__dirname, 'engine/questions/index.ts'), 'utf8');
    expect(files).not.toMatch(/Math\.random|new Date\(/);
    expect(readFileSync(path.join(engineDir, 'ruleEngine.ts'), 'utf8')).not.toMatch(/Math\.random|new Date\(/);
    expect(readFileSync(path.join(engineDir, 'reading.ts'), 'utf8')).not.toMatch(/Math\.random|new Date\(/);
    expect(readFileSync(path.join(engineDir, 'operations.ts'), 'utf8')).not.toMatch(/Math\.random|new Date\(/);
  });
});

// ---------------------------------------------------------------------------
// 8. Interface contracts the audit fixed — kept as source-level guards
// ---------------------------------------------------------------------------
// These read the components rather than render them (the suite runs in node,
// with no DOM). They are deliberately coarse: each one guards a specific
// defect the Prompt 14 browser pass measured, so that deleting the fix fails
// a test instead of quietly regressing the screen.

describe('interface contracts', () => {
  it('keeps exactly one named scroll container for the app shell', () => {
    const layout = repoFile('app/layout.tsx');
    expect(layout.match(/<div data-app-scroll/g)?.length).toBe(1);
    expect(layout).toContain('overflow-y-auto');
  });

  it('returns a finished reading to the top of the screen', () => {
    // Measured defect: the casting board is completed at its bottom, so the
    // result screen opened ~800px down — past the question and the verdict.
    const flow = repoFile('components/raml/CastingFlow.tsx');
    expect(flow).toContain('[data-app-scroll]');
    expect(flow).toMatch(/\.scrollTo\(\{\s*top: 0\s*\}\)/);
    expect(flow).toMatch(/\}, \[step\]\)/);
  });

  it('clears the whole previous casting when a new reading starts', () => {
    const flow = repoFile('components/raml/CastingFlow.tsx');
    const reset = flow.slice(flow.indexOf('function reset()'), flow.indexOf('function startCasting'));
    for (const setter of ["setStep('ask')", 'setIntentionId(', "setQuestion('')", 'setChart(null)']) {
      expect(reset, setter).toContain(setter);
    }
  });

  it('routes a consolidated duplicate to the engine instead of the fallback parser', () => {
    // PROMPT 27C: ResultTabs no longer calls runReading() itself (that
    // pulled the whole engine into the client bundle) — it still resolves
    // a consolidated duplicate to its canonical engine question id via
    // resolveEngineQuestionId, then fetches that question's computed
    // result from the server reading route. See
    // lib/server/raml/readingService.ts, which calls the SAME
    // runReading() unchanged, server-side.
    const tabs = repoFile('components/raml/ResultTabs.tsx');
    expect(tabs).toContain('resolveEngineQuestionId');
    expect(tabs).toMatch(/intentionId:\s*resolvedEngineId/);
    expect(tabs).toMatch(/fetch\('\/api\/raml\/reading'/);
    const readingService = repoFile('lib/server/raml/readingService.ts');
    expect(readingService).toMatch(/runReading\(chart, intentionId\)/);
  });

  it('never claims a chart was read for material that has no automatic reading', () => {
    const tab = repoFile('components/raml/ReadingTab.tsx');
    expect(tab).toContain('getQuestionAvailability');
    // The heading now comes from the shared product wording (Prompt 15,
    // section 14) rather than being typed inline here.
    expect(tab).toContain('NO_AUTOMATIC_READING_HEADING');
    expect(NO_AUTOMATIC_READING_HEADING).toBe('No automatic reading for this one');
    // The old copy asserted the houses "have already been read off your own
    // chart" for every entry, including reference tables and rituals. It must
    // now sit on the readable branch only.
    const claim = 'have already been read off your';
    expect(tab.indexOf(claim)).toBeGreaterThan(tab.indexOf('NO_AUTOMATIC_READING_HEADING'));
  });

  it('labels the picker’s non-question entries before they are chosen', () => {
    // The badge moved onto the question card when the picker was rebuilt
    // around categories and search (Prompt 15, section 4).
    const card = repoFile('components/raml/QuestionCard.tsx');
    expect(card).toContain('availability.kind');
    expect(card).toContain('availability.badge');
    expect(card).toContain('Uses the canonical method');
  });

  it('gives the result screen a heading and announces it to assistive tech', () => {
    const header = repoFile('components/raml/reading/ReadingHeader.tsx');
    expect(header).toContain('role="status"');
    expect(header).toMatch(/<h2/);
  });

  it('labels the two free-text inputs a user can reach before casting', () => {
    // Both inputs kept their labels through the Prompt 15 rebuild; the
    // wording changed with them (the intention field now says plainly that
    // it does not affect the calculation, and the picker filter became a
    // search field).
    expect(repoFile('components/raml/CastingFlow.tsx')).toMatch(/aria-label="Your question or intention \(optional\)"/);
    expect(repoFile('components/raml/IntentionPicker.tsx')).toMatch(/aria-label="Search questions"/);
  });
});
