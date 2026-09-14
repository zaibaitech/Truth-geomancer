// Structural guards for the redesigned results screen (Prompt 19 — simplify,
// clarify, be transparent). This app has no component-rendering test
// harness, so — following the pattern already established by
// productUx.test.ts's "interface contracts" and castingUi.test.ts — these
// read the shipped component source directly and assert on where things
// live, not what they render pixel-for-pixel. The presentation LOGIC (which
// answer, which status line) is unit-tested directly in
// resultPresentation.test.ts; this file only proves the pieces are wired
// into the screen the way Prompt 19 asked for.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}

const VIEW = repoFile('components/raml/EngineReadingView.tsx');
const OUTCOME = repoFile('components/raml/reading/OutcomeCard.tsx');
const DETAILS = repoFile('components/raml/reading/CalculationDetails.tsx');

describe('primary reading screen shows only the answer and its agreement status', () => {
  it('labels the primary card "Reading", never "Primary Indication" or an invented method hierarchy', () => {
    expect(OUTCOME).toContain('Reading</p>');
    expect(OUTCOME.toLowerCase()).not.toContain('primary indication');
    expect(OUTCOME.toLowerCase()).not.toContain('overall indication');
  });

  it('builds the primary card from the whole ReadingResult, using the tested presentation helper', () => {
    expect(OUTCOME).toContain("from '@/lib/raml/resultPresentation'");
    expect(OUTCOME).toContain('computePrimaryStatus(result)');
    expect(OUTCOME).toContain('primaryAnswerText(result, status)');
  });

  it('only shows the method-by-method breakdown when there is no single agreed answer', () => {
    expect(OUTCOME).toMatch(/status\.showBreakdown\s*\?/);
  });

  it('never renders houses, figure names or quality labels on the primary card itself', () => {
    expect(OUTCOME).not.toContain('housesUsed');
    expect(OUTCOME).not.toContain('dotPattern');
    expect(OUTCOME).not.toContain('FigureGlyph');
  });

  it('routes the insufficient-data state to its own existing, unmodified notice', () => {
    expect(VIEW).toContain('result.isInsufficient');
    expect(VIEW).toContain('<InsufficientNotice');
  });
});

describe('"How this was determined" is the one gateway to technical detail', () => {
  const disclosureStart = VIEW.indexOf('id="reading-working"');

  it('finds the disclosure region in the view', () => {
    expect(disclosureStart).toBeGreaterThan(-1);
  });

  it('moved FigureCard out of the primary screen entirely — its data still reaches the reader via each method’s own card', () => {
    // The primary indicator's figure/quality/outcome/interpretation data is
    // not deleted: it reappears as that method's own row inside
    // CalculationDetails ("Verified Methods"), so rendering it a second time
    // as a standalone "Primary indication" card would only duplicate it.
    const code = VIEW.split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(code).not.toMatch(/FigureCard/);
  });

  it('keeps Method Consistency and Supporting Indicators out of the primary section and inside the disclosure only', () => {
    const primarySection = VIEW.slice(0, disclosureStart);
    const disclosureSection = VIEW.slice(disclosureStart);
    expect(primarySection).not.toMatch(/<MethodConsistencyCard/);
    expect(primarySection).not.toMatch(/<SupportingIndicators/);
    expect(disclosureSection).toMatch(/<MethodConsistencyCard/);
    expect(disclosureSection).toMatch(/<SupportingIndicators/);
  });

  it('keeps the full per-method technical breakdown (Calculation Details) inside the disclosure', () => {
    const disclosureSection = VIEW.slice(disclosureStart);
    expect(disclosureSection).toMatch(/<CalculationDetails/);
    // Still the same underlying component with houses/working/result figure/
    // source quote — untouched (proved directly by castingUi.test.ts).
    expect(DETAILS).toContain('Houses used');
    expect(DETAILS).toContain('Working');
    expect(DETAILS).toContain('Result figure');
  });

  it('renames the expanded heading away from the disclosure control’s own words, and away from any hierarchy claim', () => {
    expect(DETAILS).toContain('Verified Methods');
    expect(DETAILS.toLowerCase()).not.toContain('primary indication');
  });

  it('repeats the full source-verification wording inside the disclosure, not only as the compact note above it', () => {
    const disclosureSection = VIEW.slice(disclosureStart);
    expect(disclosureSection).toContain('result.verificationNotice');
    expect(disclosureSection).toContain('Source verification notes');
  });

  it('still collapses by default and announces its state to assistive tech', () => {
    expect(VIEW).toContain('aria-expanded={showCalculation}');
    expect(VIEW).toMatch(/useState\(false\)/);
    expect(VIEW).toContain('aria-controls="reading-working"');
  });
});

describe('source attribution stays visible and compact', () => {
  it('shows a small, always-visible SOURCE line built from the reading’s own source references', () => {
    expect(VIEW).toContain('Source</p>');
    expect(VIEW).toContain('result.sourceReferences.map((s) => s.label)');
  });

  it('never fabricates a source — the compact line only renders when references exist', () => {
    expect(VIEW).toMatch(/result\.sourceReferences\.length > 0/);
  });

  it('keeps the qualification about unverified material secondary, not the loudest thing on screen', () => {
    // VerificationNotice is a one-line component with a link, not a Card —
    // still rendered, still visible, never given the primary card's weight.
    const notice = repoFile('components/raml/reading/VerificationNotice.tsx');
    expect(notice).not.toContain('<Card');
    expect(VIEW).toContain('<VerificationNotice');
  });
});

describe('no fabricated confidence or certainty language anywhere in the changed files', () => {
  it('scans every file this prompt touched', () => {
    const forbidden = /\d+%|confidence|probability|\bcertain\b|\bdefinitely\b|\bguaranteed\b/i;
    for (const src of [VIEW, OUTCOME, DETAILS, repoFile('lib/raml/resultPresentation.ts')]) {
      expect(src).not.toMatch(forbidden);
    }
  });
});

describe('nothing about the geomancy engine moved', () => {
  it('touches only presentation files — the engine, chart model and rule engine are untouched by this prompt', () => {
    for (const file of ['lib/raml/casting.ts', 'lib/raml/engine/chartModel.ts', 'lib/raml/engine/ruleEngine.ts', 'lib/raml/engine/operations.ts']) {
      const src = repoFile(file);
      expect(src).not.toMatch(/resultPresentation|computePrimaryStatus|primaryAnswerText/);
    }
  });

  it('keeps resultPresentation.ts a pure formatter with no casting, chart or rule-engine imports', () => {
    const code = repoFile('lib/raml/resultPresentation.ts')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(code).not.toMatch(/reduceCount\(|buildChart\(|runReading\(|COMPARE_RESULTS\(|buildChartModel\(/);
    expect(code).not.toMatch(/from '\.\/(casting|engine\/(chartModel|ruleEngine|operations))'/);
  });
});
