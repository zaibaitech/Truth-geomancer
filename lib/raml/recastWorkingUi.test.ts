// Prompt 74 — recast-working presentation. Structural guards in the style
// already established by resultsUi.test.ts/castingUi.test.ts (this repo has
// no jsdom/@testing-library/react — see vitest.config.ts's `environment:
// 'node'`): these read the shipped component source directly, plus run the
// real engine, rather than rendering pixels. The rule this file exists to
// enforce: the recast diagram is driven only by generic casting metadata
// and the method's own already-computed result — never a hard-coded
// question id, chapter number, house number, or figure/interpretation
// string — and Method 2 (a plain named-houses method, not a recast) is
// completely unaffected.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runReading } from './engine';
import { fixtureChart } from './engine/__tests__/fixtures';
import { getEffectiveCastingRequirement, toPublicCastingMeta } from './engine/castingRequirement';
import { QUESTION_REGISTRY } from './engine/questions';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}

const ENEMIES_ID = 'if-your-enemies-are-working-against-you-or';
const DIAGRAM = repoFile('components/raml/reading/RecastWorkingDiagram.tsx');
const DETAILS = repoFile('components/raml/reading/CalculationDetails.tsx');
const READING = repoFile('lib/raml/engine/reading.ts');
// Comments (including the file's own doc comment, which uses "H3, H7, H11,
// H15" purely as a prose EXAMPLE of what a plain non-recast trace looks
// like) are stripped before scanning for hard-coded values — same
// convention lib/raml/castingUi.test.ts already established, since
// assertions here are about what the component's CODE does, not its prose.
const DIAGRAM_CODE = DIAGRAM.split('\n')
  .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line))
  .join('\n');

describe('RecastWorkingDiagram is generic — no hard-coded chapter/house/figure values', () => {
  it('never names Chapter 34, its question id, or its houses/figures in code', () => {
    const forbidden = [
      'Chapter 34',
      'enemies-working',
      'if-your-enemies-are-working-against-you-or',
      'H3', 'H7', 'H11', 'H15', 'H13',
      'Ibrahim', 'Musah', 'Yussif',
      'Right Witness',
    ];
    for (const token of forbidden) {
      expect(DIAGRAM_CODE).not.toContain(token);
    }
  });

  it('never checks a question or chapter id — branches only on casting metadata', () => {
    expect(DIAGRAM_CODE).not.toMatch(/questionId|chapterId|intentionId/);
  });

  it('is driven by method.casting (recastMotherHouses / recastThenHouses) and the method\'s own result fields', () => {
    expect(DIAGRAM).toContain('method.casting.recastMotherHouses');
    expect(DIAGRAM).toContain('method.casting.recastThenHouses');
  });

  it('never implies the user must cast a second time, and never labels the new chart\'s house with an original-chart shield role', () => {
    expect(DIAGRAM).toMatch(/not a second casting by you/i);
    expect(DIAGRAM).not.toMatch(/Right Witness|Left Witness|Judge|Niece|Daughter/);
  });

  it('does not import protected source content or the full engine registry', () => {
    expect(DIAGRAM).not.toMatch(/from ['"]@\/lib\/raml\/engine['"]/);
    expect(DIAGRAM).not.toMatch(/QUESTION_REGISTRY\b/);
    expect(DIAGRAM).not.toMatch(/kanzulMikban/);
  });
});

describe('CalculationDetails renders the diagram generically', () => {
  it('branches on casting.inspects === \'recast\', not a question id', () => {
    expect(DETAILS).toContain("m.casting.inspects === 'recast'");
    expect(DETAILS).toContain('<RecastWorkingDiagram');
    expect(DETAILS).not.toMatch(/enemies-working|Chapter 34/i);
  });

  it('still contains the plain Houses used / Working / Result figure blocks for non-recast methods', () => {
    expect(DETAILS).toContain('Houses used');
    expect(DETAILS).toContain('Working');
    expect(DETAILS).toContain('Result figure');
  });
});

describe('reading.ts exposes casting via the existing sanitizer, not new logic', () => {
  it('uses getEffectiveCastingRequirement + toPublicCastingMeta, the same functions Chapter 32/151 already use', () => {
    expect(READING).toContain('getEffectiveCastingRequirement');
    expect(READING).toContain('toPublicCastingMeta');
  });

  it('does not duplicate resolveQuestionCasting\'s own union/flatten logic', () => {
    expect(READING).not.toContain('resolveQuestionCasting');
    expect(READING).not.toContain('showRecastWorking');
  });
});

describe('Chapter 34 — real engine run', () => {
  const chart = fixtureChart();
  const result = runReading(chart, ENEMIES_ID)!;
  const m1 = result.methodResults.find((m) => m.id === 'enemies-working-method-1')!;
  const m2 = result.methodResults.find((m) => m.id === 'enemies-working-method-2')!;

  it('Method 1\'s row carries casting metadata identical to the engine\'s own classification', () => {
    const method1 = QUESTION_REGISTRY[ENEMIES_ID].methods[0];
    expect(m1.casting).toEqual(toPublicCastingMeta(getEffectiveCastingRequirement(method1)));
    expect(m1.casting.inspects).toBe('recast');
    expect(m1.casting.recastMotherHouses).toEqual([3, 7, 11, 15]);
    expect(m1.casting.recastThenHouses).toEqual([13]);
  });

  it('Method 2\'s row is not classified as recast — the diagram never applies to it', () => {
    expect(m2.casting.inspects).toBe('named_houses');
    expect(m2.casting.inspects).not.toBe('recast');
    expect(m2.casting.houses).toEqual([1, 12]);
    expect(m2.casting.recastMotherHouses).toBeUndefined();
  });

  it('calculate()/evaluate() results are unchanged by the presentation addition', () => {
    expect(m1.housesUsed).toEqual([3, 7, 11, 15]);
    expect(m1.calculationSteps[0]).toMatch(/used as new Mothers/);
    expect(m1.calculationSteps[1]).toMatch(/New chart's H13/);
    expect(m2.housesUsed).toEqual([1, 12]);
    expect(m2.calculationSteps[0]).toMatch(/H1.*\+.*H12/);
  });
});

describe('Chapter 151 and Chapter 32 are unaffected — neither is classified as recast', () => {
  it('Chapter 151\'s dream method inspects derived_figures, never recast', () => {
    const result = runReading(fixtureChart(), 'dreams-and-their-interpretations')!;
    const m = result.methodResults.find((r) => r.id === 'dreams-interpretation-method-1')!;
    expect(m.casting.inspects).toBe('derived_figures');
    expect(m.casting.inspects).not.toBe('recast');
  });

  it('Chapter 32\'s rain methods inspect adjacency/named_houses, never recast', () => {
    const result = runReading(fixtureChart(), 'if-it-will-rain-today-or-not')!;
    for (const m of result.methodResults) {
      expect(m.casting.inspects).not.toBe('recast');
    }
  });
});
