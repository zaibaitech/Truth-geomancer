// Prompt 76 — Chapter 151 casting UI: the user must draw exactly four
// Mothers, labelled as Mothers, never a generic 16-house-style casting
// flow. Structural guards in the style castingUi.test.ts/castingRequirement.
// test.ts already established (this repo has no jsdom/@testing-library/
// react — see vitest.config.ts's `environment: 'node'`): these read the
// shipped component source directly, resolve the same casting metadata the
// UI resolves, and run the real casting/pairing pipeline, rather than
// rendering pixels.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildChart } from './casting';
import { emptyTapGrid, mothersFromTaps, registerTap, type TapGrid } from './castingBoardState';
import { resolveQuestionCasting } from './engine/castingRequirement';
import { QUESTION_REGISTRY_META } from './questionRegistryMeta';
import { resolveEngineQuestionId } from './questionAvailability';
import { dreamWorkingFromChart } from './dreamPairingPresentation';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}

const BOARD = repoFile('components/raml/CastingBoard.tsx');
const BOARD_CODE = BOARD.split('\n')
  .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line))
  .join('\n');
const FLOW = repoFile('components/raml/CastingFlow.tsx');

const DREAMS_ID = 'dreams-and-their-interpretations';
const RAIN_ID = 'if-it-will-rain-today-or-not';
const ENEMIES_ID = 'if-your-enemies-are-working-against-you-or';

function mothersOnlyFor(intentionId: string): boolean {
  const casting = resolveQuestionCasting(QUESTION_REGISTRY_META[resolveEngineQuestionId(intentionId)]);
  return casting.showPairingWorking && !casting.showFullShieldTabs;
}

function tapOut(counts: number[][]): TapGrid {
  let grid = emptyTapGrid();
  counts.forEach((draw, d) => draw.forEach((n, l) => { for (let i = 0; i < n; i++) grid = registerTap(grid, d, l); }));
  return grid;
}

describe('CastingFlow chooses the casting board mode from the resolver, not a question id', () => {
  it('computes mothersOnly via resolveQuestionCasting/QUESTION_REGISTRY_META/resolveEngineQuestionId', () => {
    expect(FLOW).toContain('resolveQuestionCasting');
    expect(FLOW).toContain('QUESTION_REGISTRY_META');
    expect(FLOW).toContain('resolveEngineQuestionId');
    expect(FLOW).toContain('casting.showPairingWorking && !casting.showFullShieldTabs');
  });

  it('never branches on a specific question id to choose the casting UI', () => {
    expect(FLOW).not.toMatch(/intentionId === ['"]dreams-and-their-interpretations['"]/);
    expect(FLOW).not.toMatch(/=== DREAMS_QUESTION_ID/);
    expect(FLOW).not.toContain('dreams-and-their-interpretations');
  });

  it('passes the resolved flag straight through to CastingBoard', () => {
    expect(FLOW).toMatch(/<CastingBoard onComplete=\{handleCastComplete\} mothersOnly=\{mothersOnly\}\s*\/>/);
  });

  it('1. Chapter 151 resolves to mothersOnly (four Mothers + pairing, no full shield)', () => {
    expect(mothersOnlyFor(DREAMS_ID)).toBe(true);
  });

  it('regression: Chapter 32 (full-shield/named-house methods) does not resolve to mothersOnly', () => {
    expect(mothersOnlyFor(RAIN_ID)).toBe(false);
  });

  it('regression: Chapter 34 (recast, one normal casting act) does not resolve to mothersOnly', () => {
    expect(mothersOnlyFor(ENEMIES_ID)).toBe(false);
  });

  it('regression: an ordinary/unclassified question (general reading) does not resolve to mothersOnly', () => {
    expect(mothersOnlyFor('general')).toBe(false);
  });
});

describe('CastingBoard renders four Mothers, never Houses 5-16, when mothersOnly is set', () => {
  it('2-3. defines a four-entry MOTHER_NAMES row set, separate from the untouched DRAW_NAMES', () => {
    expect(BOARD).toContain("const DRAW_NAMES = ['1st Draw', '2nd Draw', '3rd Draw', '4th Draw']");
    const match = BOARD.match(/const MOTHER_NAMES = \[([^\]]*)\];/);
    expect(match).not.toBeNull();
    const names = match![1].split(',').map((s) => s.trim()).filter(Boolean);
    expect(names).toEqual(["'Mother 1'", "'Mother 2'", "'Mother 3'", "'Mother 4'"]);
  });

  it('accepts a caller-supplied mothersOnly prop — no chapter/question awareness of its own', () => {
    expect(BOARD).toContain('mothersOnly = false');
    expect(BOARD_CODE).not.toMatch(/questionId|chapterId|intentionId|dreams-and-their-interpretations/);
  });

  it('picks the row-name set generically: rowNames = mothersOnly ? MOTHER_NAMES : DRAW_NAMES', () => {
    expect(BOARD).toContain('const rowNames = mothersOnly ? MOTHER_NAMES : DRAW_NAMES;');
    expect(BOARD).toContain('{rowNames.map((name, drawIndex) => {');
  });

  it('4-5. every row still has exactly four lines, and no House 5-16 input exists anywhere in the board', () => {
    const match = BOARD.match(/const LINES = \[([^\]]*)\] as const;/);
    expect(match).not.toBeNull();
    const lineCount = match![1].split('},').filter((s) => s.trim().length > 0).length;
    expect(lineCount).toBe(4);
    expect(BOARD_CODE).not.toMatch(/\bH[5-9]\b|\bH1[0-6]\b/);
    expect(BOARD_CODE).not.toMatch(/house/i);
  });

  it('says "Mother N of 4" for mothersOnly and keeps "Draw N of 4" byte-identical for everyone else', () => {
    expect(BOARD).toMatch(/Mother \{drawIndex \+ 1\} of 4/);
    expect(BOARD).toMatch(/Draw \{drawIndex \+ 1\} of 4/);
  });

  it('never implies a second casting or a full shield in the mothersOnly copy', () => {
    expect(BOARD_CODE).not.toMatch(/Full Chart|Right Witness|Judge|Niece|Witness/i);
  });

  it('6-7. Cast Reading gating is unchanged — same disabled={!allDone} for both modes', () => {
    expect(BOARD).toMatch(/disabled=\{!allDone\}/);
    expect(BOARD).toContain('Cast Reading');
  });
});

describe('8-12. casting → pairing pipeline is unchanged by the UI relabel', () => {
  it('four completed Mothers still produce the existing dream pairing working (Pair 1, Pair 2, Final)', () => {
    // Simulates exactly what a mothersOnly board produces: 4 rows x 4 lines,
    // each tapped an odd/even number of times — the same TapGrid shape and
    // reducer a generic board produces, since the UI relabel changes no
    // tap-handling code at all.
    const grid = tapOut([
      [1, 1, 2, 1],
      [1, 2, 2, 2],
      [2, 1, 1, 1],
      [2, 2, 1, 2],
    ]);
    const mothers = mothersFromTaps(grid);
    const chart = buildChart(mothers);
    const working = dreamWorkingFromChart(chart)!;

    expect(working.mothers.map((m) => m.pattern)).toEqual(mothers);
    // 9. Pair 1 = Mother 1 + Mother 2
    expect(working.pair1.from).toBe('Mother 1 + Mother 2');
    // 10. Pair 2 = Mother 3 + Mother 4
    expect(working.pair2.from).toBe('Mother 3 + Mother 4');
    // 11. Final = Pair 1 + Pair 2
    expect(working.final.from).toBe('Pair 1 + Pair 2');
    // 12. the star/interpretation lookup itself is untouched engine code —
    // just confirm a real star resolves for the final figure.
    expect(working.final.star.id).toBeTruthy();
  });
});
