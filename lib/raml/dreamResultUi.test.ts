// Structural guards for Chapter 151's mothers-and-pairing result screen
// (Prompt 63). Logic is unit-tested in dreamPairingPresentation.test.ts;
// this file only proves the Cast result UI is wired that way and that an
// ordinary full-shield question still gets Full Chart / Overview.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}

const TABS = repoFile('components/raml/ResultTabs.tsx');
const PANEL = repoFile('components/raml/DreamWorkingPanel.tsx');
const FLOW = repoFile('components/raml/CastingFlow.tsx');
const ENGINE_Q = repoFile('lib/raml/engine/questions/dreamsAndInterpretations.ts');
const CATALOG = repoFile('lib/raml/questionCatalog.ts');
const CASTING = repoFile('lib/raml/casting.ts');
const CHART_MODEL = repoFile('lib/raml/engine/chartModel.ts');
const RULE_ENGINE = repoFile('lib/raml/engine/ruleEngine.ts');
const OPERATIONS = repoFile('lib/raml/engine/operations.ts');

function codeOnly(src: string): string {
  return src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
    .join('\n');
}

describe('D. Chapter 151 result rendering has no generic shield presentation', () => {
  it('ResultTabs branches on the casting resolver and mounts DreamWorkingPanel', () => {
    expect(TABS).toContain("from '@/lib/raml/engine/castingRequirement'");
    expect(TABS).toContain('resolveQuestionCasting');
    expect(TABS).toContain('showPairingWorking');
    expect(TABS).not.toContain('usesDreamPairingPresentation(intentionId)');
    expect(TABS).not.toMatch(/=== DREAMS_QUESTION_ID|intentionId === ['"]dreams-and-their-interpretations['"]/);
    expect(TABS).toContain('<DreamWorkingPanel chart={chart} />');
    expect(TABS).toContain('working={dreamPairing ? <DreamWorkingPanel chart={chart} /> : undefined}');
  });

  it('hides the generic tab strip, Full Chart, Judge Overview, and H6 illness card for the dream path', () => {
    expect(TABS).toContain('dreamPairing ? null : (');
    expect(TABS).toContain("!dreamPairing && tab === 'Overview'");
    expect(TABS).toContain("!dreamPairing && tab === 'Full Chart'");
    expect(TABS).toContain("!dreamPairing && tab === 'My Star'");
    expect(TABS).toContain("!dreamPairing && tab === 'Sadaqah'");
    expect(TABS).toMatch(/dreamPairing\s*\n\s*\? \['Your Reading'\]/);
  });

  it('DreamWorkingPanel names Mothers, Pair 1, Pair 2, and Final Figure — never shield roles', () => {
    expect(PANEL).toContain('The Four Mothers');
    expect(PANEL).toContain('The Pairing');
    expect(PANEL).toContain('Mother 1');
    expect(PANEL).toContain('Mother 2');
    expect(PANEL).toContain('Mother 3');
    expect(PANEL).toContain('Mother 4');
    expect(PANEL).toContain('Pair 1');
    expect(PANEL).toContain('Pair 2');
    expect(PANEL).toContain('Final Figure');
    const rendered = codeOnly(PANEL);
    expect(rendered).not.toMatch(/Daughter|Niece|Witness|Reconciler/);
    expect(rendered).not.toMatch(/The Judge|House 6|Illness/);
    expect(rendered).not.toMatch(/houses\[8\]|houses\[9\]|houses\[12\]|H9|H10|H13/);
  });

  it('does not hard-code any Chapter 151 dream result in the UI', () => {
    expect(PANEL).not.toMatch(/Ibrahim|Ayuba|Yussif|Musah/);
    expect(TABS).not.toMatch(/Ibrahim|Ayuba/);
  });
});

describe('E. Ordinary full-shield questions still render Full Chart', () => {
  it('keeps BASE_TABS with Overview and Full Chart for non-dream questions', () => {
    expect(TABS).toContain("const BASE_TABS = ['Overview', 'Full Chart', 'My Star', 'Sadaqah']");
    expect(TABS).toContain('<ChartGrid chart={chart} />');
    expect(TABS).toContain('The Judge — the chart’s verdict');
    expect(TABS).toContain('House 6 — Illness & Enemies');
  });
});

describe('F. Source quote is not rewritten into the author clarification', () => {
  it('engine source.quote remains the manuscript sentence', () => {
    expect(ENGINE_Q).toContain(
      'quote: "If you want to know the meaning of a dream, make only the first 4 stars (Umuhat) and pair them."',
    );
    expect(ENGINE_Q).toContain('THIS METHOD\'S CALCULATION PROCEDURE IS NOT MANUSCRIPT TEXT');
  });
});

describe('confirmation copy for Chapter 151', () => {
  it('CastingFlow still uses readingBrief, which now keys the dream brief off the resolver', () => {
    expect(FLOW).toContain('readingBrief(entry)');
    expect(CATALOG).toContain('resolveQuestionCasting');
    expect(CATALOG).toContain('showPairingWorking');
    expect(CATALOG).toContain('DREAM_PAIRING_BRIEF');
    expect(CATALOG).not.toContain('usesDreamPairingPresentation(entry.id)');
    expect(FLOW).toContain('You cast the sixteen houses');
  });
});

describe('engine files were not modified for this presentation', () => {
  it('calculate/evaluate pairing operations are still the ones in dreamsAndInterpretations.ts', () => {
    expect(ENGINE_Q).toContain('ADD_MULTIPLE_HOUSES(chart, [1, 2])');
    expect(ENGINE_Q).toContain('ADD_MULTIPLE_HOUSES(chart, [3, 4])');
    expect(ENGINE_Q).toContain('ADD_FIGURES([pairA.figure, pairB.figure])');
    expect(ENGINE_Q).toContain('housesUsed: [1, 2, 3, 4]');
  });

  it('does not teach ResultTabs or the dream panel to the engine modules', () => {
    for (const src of [CASTING, CHART_MODEL, RULE_ENGINE, OPERATIONS]) {
      expect(src).not.toMatch(/DreamWorkingPanel|usesDreamPairingPresentation|DREAM_PAIRING_BRIEF/);
    }
  });
});
