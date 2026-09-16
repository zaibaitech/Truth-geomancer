// Prompt 15 — the product catalogue and the experience built on it.
//
// These tests guard how the 140 questions are FOUND and PRESENTED. They make
// no claim about what any geomantic rule means: every assertion here is about
// navigation, wording and honesty, and the engine's own invariants stay where
// they are (source-reconciliation.test.ts, productUx.test.ts).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, INTENTIONS, type CategoryId } from '@/content/intentions';
import { QUESTION_REGISTRY } from './engine/questions';
import { runReading } from './engine';
import { fixtureChart } from './engine/__tests__/fixtures';
import {
  QUESTION_CATALOG,
  SUGGESTED_QUESTIONS,
  catalogEntry,
  catalogInCategory,
  categoryCounts,
  readingBrief,
  searchCatalog,
} from './questionCatalog';
import { readingToText, summariseReading } from './readingSummary';
import { INSUFFICIENT_EXPLANATION, INSUFFICIENT_HEADING, METHOD_STATUS_LABEL, methodTally } from './statusLanguage';

const chart = fixtureChart();

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '../..', relative), 'utf8');
}

// ---------------------------------------------------------------------------
// 1. One product presentation per question
// ---------------------------------------------------------------------------

describe('the catalogue covers the product exactly once', () => {
  it('holds one entry per selectable question and nothing else', () => {
    expect(QUESTION_CATALOG.length).toBe(INTENTIONS.length - 1); // minus the general-reading shortcut
    expect(new Set(QUESTION_CATALOG.map((e) => e.id)).size).toBe(QUESTION_CATALOG.length);
    expect(QUESTION_CATALOG.some((e) => e.id === 'general')).toBe(false);
  });

  it('reaches every registered engine question', () => {
    const reached = new Set(QUESTION_CATALOG.map((e) => e.engineQuestionId).filter(Boolean));
    expect(Object.keys(QUESTION_REGISTRY).every((id) => reached.has(id))).toBe(true);
    expect(reached.size).toBe(Object.keys(QUESTION_REGISTRY).length);
  });

  it('gives every entry a title, a category and a home to browse it under', () => {
    for (const entry of QUESTION_CATALOG) {
      expect(entry.title.trim().length, entry.id).toBeGreaterThan(0);
      expect(entry.sourceTitle.trim().length, entry.id).toBeGreaterThan(0);
      expect(entry.categoryId, entry.id).not.toBeNull();
      expect(entry.tags.length, entry.id).toBeGreaterThan(0);
      expect(entry.tags[0]).toBe(entry.categoryId);
    }
  });

  it('shows the engine’s own plain-language question wherever it has one', () => {
    // The manuscript's heading is kept as supporting text, never as the only
    // thing a user has to read.
    const withEngineQuestion = QUESTION_CATALOG.filter((e) => e.engineQuestionId);
    expect(withEngineQuestion.length).toBe(145);
    for (const entry of withEngineQuestion) {
      expect(entry.title).toBe(QUESTION_REGISTRY[entry.engineQuestionId!].title);
      expect(entry.hasShortTitle).toBe(entry.title !== entry.sourceTitle);
    }
  });

  it('reports each question’s method counts straight from the registry', () => {
    for (const entry of QUESTION_CATALOG) {
      const definition = entry.engineQuestionId ? QUESTION_REGISTRY[entry.engineQuestionId] : undefined;
      expect(entry.methodCount, entry.id).toBe(definition?.methods.length ?? 0);
      expect(entry.verifiedMethodCount, entry.id).toBe(
        definition?.methods.filter((m) => m.status === 'verified').length ?? 0,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Categories — every one real, every tag justified
// ---------------------------------------------------------------------------

describe('category taxonomy', () => {
  it('offers no empty category', () => {
    const counts = categoryCounts();
    for (const category of CATEGORIES) {
      expect(counts[category.id], category.id).toBeGreaterThan(0);
    }
  });

  it('tags only with real categories, and never drops the primary one', () => {
    const ids = new Set<CategoryId>(CATEGORIES.map((c) => c.id));
    for (const entry of QUESTION_CATALOG) {
      for (const tag of entry.tags) expect(ids.has(tag), `${entry.id}/${tag}`).toBe(true);
      expect(new Set(entry.tags).size).toBe(entry.tags.length);
    }
  });

  it('allows a question to sit under more than one category when its own wording supports it', () => {
    const multi = QUESTION_CATALOG.filter((e) => e.tags.length > 1);
    expect(multi.length).toBeGreaterThan(10);
    // e.g. returning from a trip WITH money is both travel and work.
    const travel = catalogEntry('traveling-business-and-if-you-will-return-from')!;
    expect(travel.tags).toContain('travel-change');
    expect(travel.tags.length).toBeGreaterThan(1);
  });

  it('lists a category’s questions alphabetically, and only its own', () => {
    for (const category of CATEGORIES) {
      const list = catalogInCategory(category.id);
      expect(list.every((e) => e.tags.includes(category.id)), category.id).toBe(true);
      expect(list.map((e) => e.title)).toEqual([...list.map((e) => e.title)].sort((a, b) => a.localeCompare(b)));
    }
  });

  it('browses every catalogue entry from at least one category', () => {
    const browsable = new Set(CATEGORIES.flatMap((c) => catalogInCategory(c.id).map((e) => e.id)));
    expect(QUESTION_CATALOG.filter((e) => !browsable.has(e.id))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Search — finds what exists, invents nothing
// ---------------------------------------------------------------------------

describe('question search', () => {
  it('returns the whole catalogue for an empty query', () => {
    expect(searchCatalog('').length).toBe(QUESTION_CATALOG.length);
    expect(searchCatalog('   ').length).toBe(QUESTION_CATALOG.length);
  });

  it('can only ever return existing catalogue entries', () => {
    const ids = new Set(QUESTION_CATALOG.map((e) => e.id));
    for (const term of ['money', 'marriage', 'enemy', 'zzzz', 'chapter 19']) {
      for (const hit of searchCatalog(term)) expect(ids.has(hit.id), `${term}/${hit.id}`).toBe(true);
    }
  });

  it('answers the ordinary words a person would type', () => {
    for (const term of ['business', 'marriage', 'money', 'enemy', 'travel', 'lost', 'success', 'health', 'where', 'who', 'when']) {
      expect(searchCatalog(term).length, term).toBeGreaterThan(0);
    }
  });

  it('finds a question by its chapter number', () => {
    const hits = searchCatalog('chapter 19');
    expect(hits.some((e) => e.chapterNumber === 19)).toBe(true);
  });

  it('narrows rather than widens as words are added', () => {
    const one = searchCatalog('marriage');
    const two = searchCatalog('marriage last');
    expect(two.length).toBeLessThanOrEqual(one.length);
    expect(two.every((e) => one.some((o) => o.id === e.id))).toBe(true);
  });

  it('understands a few everyday synonyms without adding questions', () => {
    expect(searchCatalog('jail').some((e) => e.haystack.includes('prison'))).toBe(true);
    expect(searchCatalog('cash').every((e) => e.haystack.includes('money'))).toBe(true);
  });

  it('returns nothing — not a guess — when the book has no such question', () => {
    expect(searchCatalog('cryptocurrency')).toEqual([]);
  });

  it('searches a pre-filtered list when one is given', () => {
    const love = catalogInCategory('love-couple');
    const hits = searchCatalog('marriage', love);
    expect(hits.every((e) => e.tags.includes('love-couple'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. The 13 special entries keep their honest treatment
// ---------------------------------------------------------------------------

describe('special source entries', () => {
  const consolidated = QUESTION_CATALOG.filter((e) => e.availability.kind === 'consolidated');
  const noReading = QUESTION_CATALOG.filter((e) => e.availability.kind === 'no-automatic-reading');

  it('still counts 5 consolidated and 8 without an automatic reading', () => {
    expect(consolidated.length).toBe(5);
    expect(noReading.length).toBe(8);
  });

  it('routes a consolidated entry to a real engine question that is not itself', () => {
    for (const entry of consolidated) {
      expect(entry.engineQuestionId, entry.id).not.toBe(entry.id);
      expect(QUESTION_REGISTRY[entry.engineQuestionId!], entry.id).toBeDefined();
    }
  });

  it('keeps a consolidated entry’s own chapter number rather than the canonical one', () => {
    const repeated = catalogEntry('if-a-sick-person-has-long-life-repeated')!;
    const canonical = catalogEntry('if-a-sick-person-has-long-life-or')!;
    expect(repeated.engineQuestionId).toBe(canonical.id);
    expect(repeated.chapterNumber).not.toBe(canonical.chapterNumber);
  });

  it('runs no engine question for material that has none, and says which kind it is', () => {
    const badges = new Set(['Reference table', 'Figures missing', 'Practice, not a reading', 'Open-ended', 'Different method']);
    for (const entry of noReading) {
      expect(entry.engineQuestionId, entry.id).toBeNull();
      expect(entry.methodCount).toBe(0);
      if (entry.availability.kind !== 'no-automatic-reading') throw new Error('unreachable');
      expect(badges.has(entry.availability.badge), `${entry.id}: ${entry.availability.badge}`).toBe(true);
    }
  });

  it('explains such an entry in the confirmation brief instead of promising a reading', () => {
    for (const entry of noReading) {
      if (entry.availability.kind !== 'no-automatic-reading') throw new Error('unreachable');
      expect(readingBrief(entry)).toBe(entry.availability.note);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. The confirmation brief tells the truth about what will happen
// ---------------------------------------------------------------------------

describe('pre-casting brief', () => {
  it('describes every entry in a full sentence', () => {
    for (const entry of QUESTION_CATALOG) {
      const brief = readingBrief(entry);
      expect(brief.trim().length, entry.id).toBeGreaterThan(20);
    }
  });

  it('states the real method count for an ordinary question', () => {
    const entry = catalogEntry('if-you-want-to-know-if-you-will')!;
    expect(readingBrief(entry)).toContain(`${entry.methodCount} methods`);
  });

  it('never promises an answer for a question whose methods cannot all be read', () => {
    for (const entry of QUESTION_CATALOG.filter((e) => e.methodCount > 0 && e.verifiedMethodCount === 0)) {
      const brief = readingBrief(entry);
      expect(brief, entry.id).toMatch(/leaves out|explain what is missing/);
    }
  });

  it('mentions the consolidation for a repeated chapter', () => {
    const entry = catalogEntry('if-a-sick-person-has-long-life-repeated')!;
    if (entry.availability.kind !== 'consolidated') throw new Error('unreachable');
    expect(readingBrief(entry)).toContain(entry.availability.note);
  });
});

// ---------------------------------------------------------------------------
// 6. Suggested questions — chosen, not invented
// ---------------------------------------------------------------------------

describe('suggested questions', () => {
  it('are existing, answerable catalogue entries', () => {
    expect(SUGGESTED_QUESTIONS.length).toBeGreaterThanOrEqual(6);
    for (const entry of SUGGESTED_QUESTIONS) {
      expect(catalogEntry(entry.id), entry.id).toBeDefined();
      expect(entry.engineQuestionId, entry.id).not.toBeNull();
      expect(entry.verifiedMethodCount, entry.id).toBeGreaterThan(0);
    }
  });

  it('spread across categories rather than clustering in one', () => {
    const categories = new Set(SUGGESTED_QUESTIONS.map((e) => e.categoryId));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });

  it('are never presented as popular — the app records no usage', () => {
    const picker = repoFile('components/raml/IntentionPicker.tsx')
      .split('\n')
      .filter((line) => !line.trim().startsWith('*') && !line.trim().startsWith('//') && !line.includes('{/*'))
      .join('\n');
    expect(picker).toContain('Suggested questions');
    expect(picker).not.toMatch(/Popular|Most asked|Trending/);
  });
});

// ---------------------------------------------------------------------------
// 7. The result summary says exactly what the engine said
// ---------------------------------------------------------------------------

describe('result summary', () => {
  const readings = Object.keys(QUESTION_REGISTRY).map((id) => runReading(chart, id)!);

  it('names the state for every question without inventing certainty', () => {
    for (const reading of readings) {
      const summary = summariseReading(reading);
      expect(summary.question).toBe(reading.question);
      expect(summary.interpretation).toBe(reading.shortSummary);
      expect(summary.status.trim().length, reading.questionId).toBeGreaterThan(0);
      expect(summary.status).not.toMatch(/\d+%|probability|confidence|certain/i);
      expect(summary.source.length, reading.questionId).toBeGreaterThan(0);
    }
  });

  it('says “Insufficient information” exactly when nothing could be computed', () => {
    for (const reading of readings) {
      expect(summariseReading(reading).status === 'Insufficient information', reading.questionId).toBe(
        reading.isInsufficient,
      );
    }
  });

  it('says “Mixed / Conflicting indications” exactly when the methods conflict', () => {
    for (const reading of readings.filter((r) => !r.isInsufficient)) {
      expect(summariseReading(reading).status === 'Mixed / Conflicting indications', reading.questionId).toBe(
        reading.conflictingIndicators,
      );
    }
  });

  it('shows the descriptive answer itself for a descriptive result', () => {
    for (const reading of readings.filter((r) => r.resultKind === 'descriptive' && !r.isInsufficient && !r.conflictingIndicators)) {
      const summary = summariseReading(reading);
      expect(summary.status, reading.questionId).toBe(reading.descriptiveAnswer ?? 'The methods give different answers');
    }
  });

  it('shows the verdict for an outcome result', () => {
    for (const reading of readings.filter((r) => r.resultKind === 'outcome' && !r.isInsufficient && !r.conflictingIndicators)) {
      expect(summariseReading(reading).status, reading.questionId).toBe(reading.outcomeLabel);
    }
  });

  it('copies as plain text carrying the question, the state and the source', () => {
    const reading = readings.find((r) => r.questionId === 'if-you-want-to-know-if-you-will')!;
    const text = readingToText(reading, 'Will the payment land today?');
    expect(text).toContain(reading.question);
    expect(text).toContain(reading.shortSummary);
    expect(text).toContain('Asked: Will the payment land today?');
    expect(text).toContain('Source:');
    expect(text).not.toContain('undefined');
  });

  it('marks a copied insufficient reading as such rather than leaving it blank', () => {
    const blocked = readings.find((r) => r.isInsufficient)!;
    expect(readingToText(blocked)).toContain(INSUFFICIENT_HEADING);
  });
});

// ---------------------------------------------------------------------------
// 8. Status language — no developer vocabulary on screen
// ---------------------------------------------------------------------------

describe('status language', () => {
  it('translates each method status into ordinary words', () => {
    for (const label of Object.values(METHOD_STATUS_LABEL)) {
      expect(label).not.toMatch(/_|needs_review|uncertain|resultKind|sourceStatus/);
    }
    expect(METHOD_STATUS_LABEL.needs_review).toBe('Source detail missing');
    expect(METHOD_STATUS_LABEL.uncertain).toBe('Not defined in the source');
  });

  it('states the insufficient case as a limit of the manuscript', () => {
    expect(INSUFFICIENT_HEADING).not.toMatch(/data|_/i);
    expect(INSUFFICIENT_EXPLANATION).toContain('source-defined');
  });

  it('counts methods in words', () => {
    expect(methodTally(0, 1)).toContain('None of the 1 method');
    expect(methodTally(1, 1)).toBe('All 1 method read from the source.');
    expect(methodTally(2, 3)).toBe('2 of 3 methods read from the source.');
  });

  it('keeps developer vocabulary out of the user-facing components', () => {
    const forbidden = /resultKind:|ReviewReasonCode|constant_figure_undefined|sourceStatus|needs_review|insufficient_data/;
    for (const file of [
      'components/raml/reading/InsufficientNotice.tsx',
      'components/raml/reading/CalculationDetails.tsx',
      'components/raml/reading/ResultSummaryCard.tsx',
      'components/raml/QuestionCard.tsx',
    ]) {
      // Only the rendered strings matter — a prop name in a type is not user
      // -facing — so this checks the JSX text, not the whole file.
      const rendered = repoFile(file)
        .split('\n')
        .filter((line) => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
        .join('\n');
      const text = rendered.match(/>[^<>{}]+</g)?.join(' ') ?? '';
      expect(text, file).not.toMatch(forbidden);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. The screens themselves (source-level guards, as in Prompt 14)
// ---------------------------------------------------------------------------

describe('navigation contracts', () => {
  const flow = repoFile('components/raml/CastingFlow.tsx');
  const picker = repoFile('components/raml/IntentionPicker.tsx');

  it('confirms the question before any casting starts', () => {
    expect(flow).toContain("'confirm'");
    expect(flow).toContain('What this reading does');
    expect(flow).toContain('readingBrief');
    expect(flow).toContain('Start Reading');
    expect(flow).toMatch(/Kanzul Mikban — Chapter \$\{entry\.chapterNumber\}/);
  });

  it('lets the reader back out of the confirmation without casting', () => {
    expect(flow).toContain('Choose a different question');
  });

  it('says plainly that the optional text does not change the calculation', () => {
    expect(flow).toContain('Your question or intention (optional)');
    expect(flow).toContain('does not change the geomancy calculation');
  });

  it('clears the whole previous casting when a new reading starts', () => {
    const reset = flow.slice(flow.indexOf('function reset()'), flow.indexOf('function chooseQuestion'));
    for (const setter of ["setStep('ask')", 'setIntentionId(', "setQuestion('')", 'setChart(null)']) {
      expect(reset, setter).toContain(setter);
    }
  });

  it('offers search, categories and the full list over the same catalogue', () => {
    expect(picker).toContain('searchCatalog');
    expect(picker).toContain('catalogInCategory');
    expect(picker).toContain('What would you like to know?');
    expect(picker).toMatch(/Browse all \{QUESTION_CATALOG\.length\} questions/);
  });

  it('keeps the question, not the chapter number, as the loudest thing on a card', () => {
    const card = repoFile('components/raml/QuestionCard.tsx');
    const titleIndex = card.indexOf('{entry.title}');
    const chapterIndex = card.indexOf('Chapter {entry.chapterNumber}');
    expect(titleIndex).toBeGreaterThan(-1);
    expect(chapterIndex).toBeGreaterThan(titleIndex);
    // Prompt 18 moved these onto the shared reader scale: the question sits a
    // step above its own chapter line, and both grow with the reader's chosen
    // text size instead of being pinned in px.
    expect(card).toMatch(/type-body font-medium text-sand-light">\{entry\.title\}/);
    expect(card).toMatch(/type-label text-sand\/\d+">Chapter/);
  });

  it('labels every new control for assistive technology', () => {
    expect(picker).toMatch(/aria-label="Search questions"/);
    expect(picker).toMatch(/role="status"/);
    expect(repoFile('components/raml/reading/ResultSummaryCard.tsx')).toMatch(/aria-label="Copy this reading as text"/);
    expect(repoFile('components/raml/EngineReadingView.tsx')).toMatch(/aria-expanded=\{showCalculation\}/);
    expect(repoFile('components/raml/QuestionCard.tsx')).toMatch(/aria-pressed=\{selected\}/);
  });

  it('uses the extra room on a desktop instead of stretching a phone column', () => {
    expect(repoFile('app/layout.tsx')).toContain('lg:max-w-3xl');
    expect(picker).toContain('sm:grid-cols-2');
  });

  it('adds no dependency to filter 153 records', () => {
    // '@neondatabase/serverless' was added by Prompt 31C's Neon Postgres
    // migration (an unrelated, justified production-database dependency,
    // not something this filtering feature itself needed) — everything
    // else in this list predates that migration and this feature alike.
    const pkg = JSON.parse(repoFile('package.json')) as { dependencies: Record<string, string> };
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['@neondatabase/serverless', 'lucide-react', 'next', 'react', 'react-dom']);
  });
});
