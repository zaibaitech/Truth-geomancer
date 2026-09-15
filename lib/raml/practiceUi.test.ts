// Structural guards for the "Try this method" practice UI (Prompt 20). This
// app has no component-rendering test harness, so — following the pattern
// already established by productUx.test.ts and resultsUi.test.ts — these
// read the shipped component/route source directly. Eligibility and context
// LOGIC is unit-tested directly in methodPractice.test.ts; this file only
// proves the screens are wired the way the prompt asked for, and that
// nothing it touched leaked into the geomancy engine or the existing
// Reading/Casting flows.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}

const CHAPTER_CTA = repoFile('components/books/ChapterMethodPractice.tsx');
const PAGE = repoFile('app/books/[id]/read/page.tsx');
const FLOW = repoFile('components/raml/practice/MethodPracticeFlow.tsx');
const SELECTOR = repoFile('components/raml/practice/HouseSelector.tsx');
const ROUTE = repoFile('app/raml/practice/[chapterId]/[methodId]/page.tsx');
const CASTING_FLOW = repoFile('components/raml/CastingFlow.tsx');
const RESULT_TABS = repoFile('components/raml/ResultTabs.tsx');

describe('1. "Try this method" appears where a method is executable', () => {
  it('drives the CTA from the existing practicability metadata, not a hard-coded button per paragraph', () => {
    expect(CHAPTER_CTA).toContain('practicableMethodsForChapter');
    expect(CHAPTER_CTA).not.toMatch(/Method 1[\s\S]*Method 2[\s\S]*Method 3/); // no hand-listed method text
  });

  it('places the CTA as a link into the practice route, keyed by chapter and method id', () => {
    expect(CHAPTER_CTA).toMatch(/\/raml\/practice\/\$\{chapterId\}\/\$\{practicable\.method\.id\}/);
    expect(CHAPTER_CTA).toContain('Try this method');
  });

  it('is wired into the ordinary KM chapter body in the reader page, not a duplicate rendering path', () => {
    expect(PAGE).toContain('ChapterMethodPractice');
    expect(PAGE).toMatch(/<ChapterMethodPractice[\s\S]*?chapterId=\{chapter\.id\}[\s\S]*?paragraphs=\{chapter\.paragraphs\}/);
  });
});

describe('2. The original source text is preserved, never rewritten', () => {
  it('renders every paragraph through the exact same ProseParagraph the plain Prose component uses', () => {
    expect(CHAPTER_CTA).toContain("from './Prose'");
    expect(CHAPTER_CTA).toContain('<ProseParagraph');
    expect(CHAPTER_CTA).toContain('paragraphs.map');
  });
});

describe('3/11. Practice context — a distinct experience from Reading', () => {
  it('always says "Practicing", never "Your Reading" or "YOUR READING IS READY"', () => {
    expect(FLOW).toMatch(/Practicing \{method\.label\}/);
    expect(FLOW).not.toContain('Your Reading');
    expect(FLOW).not.toContain('YOUR READING IS READY');
  });

  it('shows the book/chapter source label and the chapter title as context', () => {
    expect(FLOW).toContain('chapterSourceLabel(chapterId)');
    expect(FLOW).toContain('chapter.title');
  });
});

describe('4. Uses the existing casting interface — never a second casting mechanism', () => {
  it('imports and renders the real CastingBoard component unmodified', () => {
    expect(FLOW).toContain("import { CastingBoard } from '../CastingBoard'");
    expect(FLOW).toMatch(/<CastingBoard onComplete=\{onCastComplete\}/);
  });

  it('builds the chart with the same buildChart() the rest of the app uses, not a new reducer', () => {
    expect(FLOW).toContain("import { buildChart, type Chart } from '@/lib/raml/casting'");
    expect(FLOW).toMatch(/buildChart\(mothers\)/);
  });

  it('never redefines reduceCount, addRows or addPatterns — no parallel casting engine', () => {
    expect(FLOW).not.toMatch(/function reduceCount|function addRows|function addPatterns/);
  });
});

describe('5/12. Chart reuse — offers the existing chart before forcing a new cast', () => {
  it('offers to reuse the most recently cast chart via the same reconstruction history.ts uses', () => {
    expect(FLOW).toContain('mostRecentChart');
    expect(FLOW).toContain('Practice with this chart');
    expect(FLOW).toContain('Cast a chart');
  });

  it('never mutates or replaces the reused chart before rendering it', () => {
    // useExistingChart only ever calls setChart(existing.chart) — it never
    // constructs a new Chart object from parts of the old one.
    const fn = FLOW.slice(FLOW.indexOf('function useExistingChart'), FLOW.indexOf('function onCastComplete'));
    expect(fn).toContain('setChart(existing.chart)');
    expect(fn).not.toMatch(/buildChart\(/);
  });
});

describe('6. House selection — required houses are highlighted and tappable, chart itself is read-only', () => {
  it('highlights only the required houses and lets the user tap to confirm them', () => {
    expect(SELECTOR).toContain('isRequired');
    expect(SELECTOR).toContain('onClick={() => onToggle(h.n)}');
    expect(SELECTOR).toContain('aria-pressed={isSelected}');
  });

  it('never accepts a callback that could change the underlying chart figures', () => {
    expect(SELECTOR).not.toMatch(/setChart|onChart|chart\s*[:=]\s*\(/);
    // The only mutation surface is the caller's own selected-set toggle.
    expect(SELECTOR).toContain('onToggle: (n: number) => void');
  });

  it('gates Continue on every required house actually being selected', () => {
    expect(FLOW).toContain('housesConfirmed');
    expect(FLOW).toMatch(/selectedRequiredCount === requiredHouses\.length/);
    expect(FLOW).toMatch(/disabled=\{current === 'houses' && !housesConfirmed\}/);
  });

  it('drives the live selection count from the same required-houses list, not a hard-coded total', () => {
    expect(FLOW).toContain('selectedRequiredCount');
    expect(FLOW).toMatch(/requiredHouses\.filter\(\(h\) => selectedHouses\.has\(h\)\)\.length/);
    expect(FLOW).toMatch(/\{selectedRequiredCount\} of \{requiredHouses\.length\}/);
  });

  it('derives the required houses from the same computed reading, never a hand-typed list', () => {
    expect(FLOW).toContain('row.housesUsed');
  });
});

describe('7. Calculation — reuses the existing engine, never a duplicate implementation', () => {
  it('calls runReading(), the exact function the Reading flow uses, and reads one method’s own row', () => {
    expect(FLOW).toContain("import { runReading } from '@/lib/raml/engine'");
    expect(FLOW).toMatch(/runReading\(chart, practicable\.questionId\)/);
    expect(FLOW).toMatch(/methodResults\.find\(\(m\) => m\.id === practicable\.method\.id\)/);
  });

  it('walks the already-computed calculationSteps array as the step sequence, never inventing sub-steps', () => {
    expect(FLOW).toContain('row.calculationSteps');
    expect(FLOW).toMatch(/Array<WalkthroughStep>\(workingCount\)\.fill\('working'\)/);
  });

  it('shows a descriptive stage label (Prompt 21) rather than a bare step count, keyed off the real stage sequence', () => {
    expect(FLOW).toContain('STAGE_LABEL[current]');
    expect(FLOW).toContain("houses: 'Step 1 · Select the houses'");
    expect(FLOW).toContain("working: 'Step 2 · See the calculation'");
    expect(FLOW).toContain("result: 'Step 3 · See the result'");
    // Never a raw numeric counter left over from before this prompt.
    expect(FLOW).not.toMatch(/Step \{stepIndex \+ 1\} of \{steps\.length\}/);
  });
});

describe('Prompt 21 — clearer mobile UX for the practice flow', () => {
  it('gives the house-selection stage its own heading and a plain tap instruction, never hard-coding H1/H8/H9/H11', () => {
    expect(FLOW).toContain('Select the houses used by this method');
    expect(FLOW).toContain('Tap each house to select it.');
    expect(FLOW).not.toMatch(/H1.*H8.*H9.*H11/);
  });

  it('lists the required houses dynamically from requiredHouses, never a fixed string', () => {
    expect(FLOW).toMatch(/\{requiredHouses\.map\(\(h\) => `H\$\{h\}`\)\.join\(' · '\)\}/);
  });

  it('never assumes a method needs exactly four houses anywhere in the selection copy', () => {
    expect(FLOW).not.toMatch(/of 4 houses selected/);
    expect(FLOW).not.toContain("'4 of 4'");
  });

  it('labels the working stage "Source operation" and keeps the calculation line untouched', () => {
    expect(FLOW).toContain('Source operation');
    expect(FLOW).toMatch(/\{row\.calculationSteps\[stepIndex - 1\]\}/);
    expect(FLOW).not.toContain('>Working<');
  });

  it('adds only a method-labelled educational caption under the working stage — no new interpretation', () => {
    expect(FLOW).toMatch(/This is the operation specified by \{method\.label\}\./);
  });

  it('announces a chart-ready transition only right after this session’s own casting, never when reusing a chart', () => {
    expect(FLOW).toContain('justCast');
    expect(FLOW).toContain('Chart ready.');
    const reuseFn = FLOW.slice(FLOW.indexOf('function useExistingChart'), FLOW.indexOf('function onCastComplete'));
    const castFn = FLOW.slice(FLOW.indexOf('function onCastComplete'), FLOW.indexOf('function toggleHouse'));
    expect(reuseFn).toContain('setJustCast(false)');
    expect(castFn).toContain('setJustCast(true)');
  });

  it('never turns the transition into a second full page — it renders inside the existing houses step', () => {
    const housesBlock = FLOW.slice(FLOW.indexOf("current === 'houses' ?"), FLOW.indexOf("current === 'working' ?"));
    expect(housesBlock).toContain('justCast');
    expect(housesBlock).toContain('HouseSelector');
  });
});

describe('8. Result — source-faithful, no fabricated certainty', () => {
  it('shows the result figure, the outcome, and the verdict’s own interpretation text verbatim', () => {
    expect(FLOW).toContain('row.resultFigureName');
    expect(FLOW).toContain('row.outcomeLabel');
    expect(FLOW).toContain('row.interpretation');
  });

  it('keeps the result card exactly as it was — heading, badge and phrasing untouched by this prompt', () => {
    expect(FLOW).toContain('Method result');
    expect(FLOW).toContain('According to the source, this indicates:');
    expect(FLOW).toMatch(/OUTCOME_TONE\[row\.outcome\]/);
  });

  it('links the result back to the exact source quote used for the calculation, toggle-revealed', () => {
    expect(FLOW).toContain('row.sourceQuote');
    expect(FLOW).toContain('View source instructions');
    expect(FLOW).toContain('showSource');
  });

  it('never claims certainty, truth or a guarantee anywhere text is actually shown to a reader', () => {
    // Scoped to rendered JSX text (not the whole file) so a legitimate code
    // token like `setJustCast(true)` can't trip this — the same technique
    // questionCatalog.test.ts's "status language" check uses.
    const forbidden = /\btrue\b|\bguaranteed?\b|\bcertain(ty)?\b|\bdefinitely\b|\d+%|confidence|probability/i;
    for (const src of [FLOW, SELECTOR, CHAPTER_CTA]) {
      const rendered = src
        .split('\n')
        .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
        .join('\n');
      const text = rendered.match(/>[^<>{}]+</g)?.join(' ') ?? '';
      expect(text).not.toMatch(forbidden);
    }
  });
});

describe('9. Multiple methods launch independent contexts (route-level)', () => {
  it('the practice route reads BOTH chapterId and methodId from its own URL segment, never a shared/global selection', () => {
    expect(ROUTE).toMatch(/params:\s*\{\s*chapterId:\s*string;\s*methodId:\s*string\s*\}/);
    expect(ROUTE).toContain('chapterId={params.chapterId}');
    expect(ROUTE).toContain('methodId={params.methodId}');
  });
});

describe('13. How this method works — a concise, static introduction before the first step', () => {
  it('shows the four-point mechanism the prompt specifies, once, before casting', () => {
    expect(FLOW).toContain('How this method works');
    for (const line of ['Cast a chart', 'Follow the houses specified by the source', 'Perform the source operation', 'See the traditional result']) {
      expect(FLOW).toContain(line);
    }
  });
});

describe('14. Unresolved methods never get a misleading practice experience', () => {
  it('shows a neutral, honest label instead of a walkthrough when the method cannot be resolved', () => {
    expect(FLOW).toContain('Source method — practice unavailable');
    expect(FLOW).toContain('!practicable || !chapter');
  });

  it('never lets an unverified method reach runReading() by relying on findPracticableMethod’s own verified-only gate', () => {
    expect(FLOW).toContain('findPracticableMethod(chapterId, methodId)');
  });
});

describe('15. Mobile — reuses the shared type scale, no fixed px text, no raw Tailwind size utilities', () => {
  it('uses the shared type-* tokens throughout the new components', () => {
    for (const src of [FLOW, SELECTOR, CHAPTER_CTA]) {
      expect(src).toMatch(/type-(label|meta|body|evidence|quote|verdict|section|method|title)/);
      expect(src).not.toMatch(/text-\[\d+(\.\d+)?px\]/);
      expect(src).not.toMatch(/\btext-(xs|sm|base|lg|xl|[2-9]xl)\b/);
    }
  });

  it('gives every tap target a comfortable minimum height', () => {
    expect(SELECTOR).toContain('min-h-[84px]');
    expect(FLOW).toMatch(/min-h-\[(44|48|52)px\]/);
  });
});

describe('10/11. Existing Reading and Casting flows are unchanged', () => {
  it('CastingFlow.tsx and ResultTabs.tsx never reference the new practice module', () => {
    expect(CASTING_FLOW).not.toMatch(/methodPractice|MethodPracticeFlow|practicableMethodsForChapter/);
    expect(RESULT_TABS).not.toMatch(/methodPractice|MethodPracticeFlow|practicableMethodsForChapter/);
  });

  it('the Reading flow’s own composition (EngineReadingView) is untouched by this prompt', () => {
    const view = repoFile('components/raml/EngineReadingView.tsx');
    expect(view).not.toMatch(/methodPractice|MethodPracticeFlow/);
  });
});

describe('regression: nothing about the geomancy engine moved', () => {
  it('no engine file references the new practice module', () => {
    for (const file of ['lib/raml/casting.ts', 'lib/raml/engine/chartModel.ts', 'lib/raml/engine/ruleEngine.ts', 'lib/raml/engine/operations.ts']) {
      expect(repoFile(file)).not.toMatch(/methodPractice|practicableMethodsForChapter|MethodPracticeFlow/);
    }
  });

  it('methodPractice.ts calculates nothing itself — no parity/reduction/rule-evaluation logic', () => {
    const code = repoFile('lib/raml/methodPractice.ts')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(code).not.toMatch(/reduceCount\(|addRows\(|addPatterns\(|COMPARE_RESULTS\(|buildChartModel\(/);
  });
});
