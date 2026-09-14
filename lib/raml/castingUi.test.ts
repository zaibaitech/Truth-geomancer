// Prompt 17 — the casting interaction and the readability of the working.
//
// The rule this file exists to enforce: the engine still counts every mark,
// and the reader is never shown that count — not on screen, not in the
// accessibility tree, not indirectly through a figure revealed mid-cast. The
// chart a given sequence of taps produces is unchanged.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildChart, reduceCount } from './casting';
import { FIXTURE_MOTHERS, FIXTURE_STAR_IDS } from './engine/__tests__/fixtures';
import {
  activeDrawIndex,
  emptyTapGrid,
  isCastComplete,
  isDrawComplete,
  linesMarked,
  mothersFromTaps,
  registerTap,
  type TapGrid,
} from './castingBoardState';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '../..', relative), 'utf8');
}

const BOARD = repoFile('components/raml/CastingBoard.tsx');
/** The board with its comments stripped — several of them quote the very
 * wording that must never reach the screen ("Fire, 8 taps"), so assertions
 * about what a reader sees have to look at the code, not the prose. */
const BOARD_CODE = BOARD.split('\n')
  .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line))
  .join('\n');
const DETAILS = repoFile('components/raml/reading/CalculationDetails.tsx');
const GLOBALS = repoFile('app/globals.css');

/** Applies a grid of tap counts the way a person tapping would: one tap at a
 * time, in order, through the same reducer the board uses. */
function tapOut(counts: number[][]): TapGrid {
  let grid = emptyTapGrid();
  counts.forEach((draw, d) =>
    draw.forEach((n, l) => {
      for (let i = 0; i < n; i++) grid = registerTap(grid, d, l);
    }),
  );
  return grid;
}

// ---------------------------------------------------------------------------
// 1. The count still happens, exactly as before
// ---------------------------------------------------------------------------

describe('the engine still counts every mark', () => {
  it('records each tap individually, however fast they come', () => {
    let grid = emptyTapGrid();
    for (let i = 0; i < 50; i++) grid = registerTap(grid, 0, 0);
    expect(grid[0][0]).toBe(50);
    // and nothing else moved
    expect(grid.flat().reduce((a, b) => a + b, 0)).toBe(50);
  });

  it('never coalesces or drops a tap in a rapid burst', () => {
    const counts = [
      [17, 1, 2, 9],
      [3, 8, 5, 4],
      [11, 6, 7, 2],
      [1, 13, 4, 6],
    ];
    const grid = tapOut(counts);
    expect(grid).toEqual(counts);
  });

  it('keeps the parity rule the engine defines, untouched', () => {
    for (let n = 1; n <= 20; n++) {
      expect(mothersFromTaps(tapOut([[n, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]]))[0][0]).toBe(
        reduceCount(n),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Regression: the same taps still give the same chart
// ---------------------------------------------------------------------------

describe('the same tap sequence still produces the same chart', () => {
  it('reproduces the suite’s hand-verified chart from its tap counts', () => {
    const mothers = mothersFromTaps(tapOut([[1, 1, 2, 1], [1, 2, 2, 2], [2, 1, 1, 1], [2, 2, 1, 2]]));
    expect(mothers).toEqual(FIXTURE_MOTHERS);
    expect(buildChart(mothers).houses.map((h) => h.star.id)).toEqual(FIXTURE_STAR_IDS);
  });

  it('gives the same chart for any tap counts of the same parity', () => {
    // The reader tapping 7 times and tapping once are the same mark to the
    // book; the board must not have changed that.
    const few = mothersFromTaps(tapOut([[1, 1, 2, 1], [1, 2, 2, 2], [2, 1, 1, 1], [2, 2, 1, 2]]));
    const many = mothersFromTaps(tapOut([[7, 9, 12, 3], [5, 8, 6, 14], [4, 11, 13, 9], [2, 6, 15, 10]]));
    expect(many).toEqual(few);
    expect(buildChart(many).houses.map((h) => h.star.id)).toEqual(FIXTURE_STAR_IDS);
  });

  it('is deterministic across repeats', () => {
    const counts = [[3, 4, 5, 6], [2, 2, 1, 1], [9, 8, 7, 6], [1, 2, 3, 4]];
    expect(mothersFromTaps(tapOut(counts))).toEqual(mothersFromTaps(tapOut(counts)));
  });
});

// ---------------------------------------------------------------------------
// 3. Derived state the board is allowed to show
// ---------------------------------------------------------------------------

describe('draw progress', () => {
  it('counts lines marked, not taps — and never passes four', () => {
    let grid = emptyTapGrid();
    for (let i = 0; i < 30; i++) grid = registerTap(grid, 0, 0);
    expect(linesMarked(grid, 0)).toBe(1);
    grid = registerTap(grid, 0, 1);
    grid = registerTap(grid, 0, 2);
    grid = registerTap(grid, 0, 3);
    expect(linesMarked(grid, 0)).toBe(4);
    expect(isDrawComplete(grid, 0)).toBe(true);
  });

  it('moves to the next unfinished draw', () => {
    let grid = emptyTapGrid();
    expect(activeDrawIndex(grid)).toBe(0);
    for (let l = 0; l < 4; l++) grid = registerTap(grid, 0, l);
    expect(activeDrawIndex(grid)).toBe(1);
    for (let d = 1; d < 4; d++) for (let l = 0; l < 4; l++) grid = registerTap(grid, d, l);
    expect(activeDrawIndex(grid)).toBe(3);
    expect(isCastComplete(grid)).toBe(true);
  });

  it('is not complete until every line of every draw carries a mark', () => {
    let grid = emptyTapGrid();
    for (let d = 0; d < 4; d++) for (let l = 0; l < 3; l++) grid = registerTap(grid, d, l);
    expect(isCastComplete(grid)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. The count is not shown — anywhere
// ---------------------------------------------------------------------------

describe('the reader is never shown the tap count', () => {
  it('renders no tap number on a line', () => {
    // The old board printed {drawTaps[elementIndex]} beside a "tap" label.
    expect(BOARD).not.toMatch(/\{drawTaps\[elementIndex\]\}/);
    expect(BOARD).not.toMatch(/>\s*tap\s*</i);
    expect(BOARD).not.toMatch(/\{taps\[[^\]]+\]\[[^\]]+\]\}/);
  });

  it('offers no counting language', () => {
    expect(BOARD_CODE).not.toMatch(/Tap \d+ times|\d+ taps|tap count|times tapped/i);
    expect(BOARD).toContain('Don’t count your taps');
  });

  it('says only that a mark registered, never how many', () => {
    expect(BOARD).toContain('tap registered.');
    expect(BOARD).not.toMatch(/registered.*\$\{[^}]*taps?\[/);
  });

  it('keeps the count out of the accessibility tree', () => {
    const ariaLabels = BOARD.match(/aria-label=\{?[^\n]*/g) ?? [];
    expect(ariaLabels.length).toBeGreaterThan(0);
    for (const label of ariaLabels) {
      expect(label, label).not.toMatch(/drawTaps|taps\[|\bcount\b/);
    }
    // The one live region announces the line, not a number.
    expect(BOARD).toMatch(/setAnnouncement\(`\$\{LINES\[lineIndex\]\.label\} tap registered\.`\)/);
  });

  it('does not reveal a draw’s figure before the casting is finished', () => {
    // The old board rendered a FigureGlyph as soon as a draw's four lines
    // were marked, which let a reader work out the parity — and so the
    // figure — mid-cast.
    expect(BOARD).not.toContain('FigureGlyph');
    expect(BOARD).not.toContain('reduceCount');
  });

  it('shows draw stage rather than tap totals', () => {
    expect(BOARD).toMatch(/Draw \{drawIndex \+ 1\} of 4/);
    expect(BOARD).toMatch(/lines marked/);
  });
});

// ---------------------------------------------------------------------------
// 4b. Source alignment — the four casting rows are Lines, not elements
// ---------------------------------------------------------------------------
//
// "The Master of Geomancy" describes casting as making "4 straight lines
// with dots", and only afterward names the resulting four figures the
// "Umuhat mother stars." It never assigns Fire/Air/Water/Earth to these four
// rows while they are being drawn — that labelling came from a different
// app. The engine's own Element type ('fire'|'air'|'water'|'sand' in
// operations.ts, interpret.ts, etc.) is a real, separately-established part
// of chart INTERPRETATION after casting, and is untouched by this change —
// these tests are about the casting board's row labels only.

describe('casting rows are labelled Line 1-4, not Fire/Air/Water/Earth', () => {
  it('does not display Fire/Air/Water/Earth as the primary casting row labels', () => {
    expect(BOARD_CODE).not.toMatch(/\bFire\b/);
    expect(BOARD_CODE).not.toMatch(/\bAir\b/);
    expect(BOARD_CODE).not.toMatch(/\bWater\b/);
    expect(BOARD_CODE).not.toMatch(/\bEarth\b/);
    expect(BOARD_CODE).not.toContain('Flame');
    expect(BOARD_CODE).not.toContain('Wind');
    expect(BOARD_CODE).not.toContain('Droplet');
    expect(BOARD_CODE).not.toContain('Mountain');
  });

  it('displays Line 1, Line 2, Line 3 and Line 4', () => {
    const LINES = repoFile('components/raml/CastingBoard.tsx');
    expect(LINES).toContain("{ label: 'Line 1' }");
    expect(LINES).toContain("{ label: 'Line 2' }");
    expect(LINES).toContain("{ label: 'Line 3' }");
    expect(LINES).toContain("{ label: 'Line 4' }");
  });

  it('does not assign an elemental meaning to a casting row', () => {
    // No per-line element/icon mapping remains on the board -- Check and
    // RotateCcw are still imported from lucide-react for the "Done" mark and
    // the reset button, unrelated to the four casting rows.
    expect(BOARD).not.toMatch(/icon:/);
    expect(BOARD).not.toMatch(/import\s*\{[^}]*Flame[^}]*\}/);
  });

  it('keeps the four-draw structure: each of the four draws still has exactly four lines', () => {
    const match = BOARD.match(/const LINES = \[([^\]]*)\] as const;/);
    expect(match).not.toBeNull();
    const lineCount = match![1].split('},').filter((s) => s.trim().length > 0).length;
    expect(lineCount).toBe(4);
    expect(BOARD).toContain("const DRAW_NAMES = ['1st Draw', '2nd Draw', '3rd Draw', '4th Draw']");
  });

  it('does not reveal a live dot/tap count during marking (unchanged from before this change)', () => {
    expect(BOARD).not.toMatch(/\{drawTaps\[lineIndex\]\}/);
    expect(BOARD_CODE).not.toMatch(/\d+ dots?\b/i);
  });

  it('preserves the underlying casting data and calculations exactly -- only row labels changed', () => {
    // Same four-draw x four-line tap grid, same parity reducer, same Mother
    // derivation -- the whole point of this change is that none of this
    // module needed to change.
    const counts = [[1, 1, 2, 1], [1, 2, 2, 2], [2, 1, 1, 1], [2, 2, 1, 2]];
    const mothers = mothersFromTaps(tapOut(counts));
    expect(mothers).toEqual(FIXTURE_MOTHERS);
    expect(buildChart(mothers).houses.map((h) => h.star.id)).toEqual(FIXTURE_STAR_IDS);
  });

  it('leaves the engine untouched: casting.ts still exports only what it did before', () => {
    const CASTING = repoFile('lib/raml/casting.ts');
    expect(CASTING).not.toMatch(/\bFire\b|\bAir\b|\bWater\b|\bEarth\b/);
  });
});

// ---------------------------------------------------------------------------
// 5. Feedback: pulse, haptic, and what happens without either
// ---------------------------------------------------------------------------

describe('tap feedback', () => {
  it('acknowledges a tap visually without drawing anything countable', () => {
    expect(BOARD).toContain('tap-pulse');
    expect(GLOBALS).toContain('@keyframes tap-pulse');
    // A row of dots would be a counter by another name.
    expect(BOARD).not.toMatch(/Array\.from\(\{ length: drawTaps|\.map\(\(_, i\) =>/);
  });

  it('asks for a haptic tick only when the device offers one', () => {
    expect(BOARD).toMatch(/typeof navigator\.vibrate === 'function'/);
    expect(BOARD).toMatch(/navigator\.vibrate\(\d{1,2}\)/); // one short tick, not a pattern
    expect(BOARD).not.toMatch(/vibrate\(\[/); // never a pattern array
  });

  it('cannot break the casting when vibration is unsupported or refused', () => {
    const fn = BOARD.slice(BOARD.indexOf('function tick()'), BOARD.indexOf('/**\n * The casting board'));
    expect(fn).toContain('try {');
    expect(fn).toContain('catch');
    // Nothing about the figure depends on it: tick() returns nothing and is
    // called after the state update.
    expect(BOARD).toMatch(/setAnnouncement\([^)]*\);\s*\n\s*tick\(\);/);
  });

  it('registers a mark from exactly one kind of event', () => {
    expect(BOARD).toMatch(/onClick=\{\(\) => tap\(drawIndex, lineIndex\)\}/);
    expect(BOARD).not.toMatch(/onPointerDown|onTouchStart|onMouseDown/);
    expect(BOARD).toContain("touchAction: 'manipulation'");
  });

  it('respects a reader who has asked for less motion', () => {
    const reduced = GLOBALS.slice(GLOBALS.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toContain('.tap-pulse');
    expect(reduced).toContain('animation: none');
    // The static "marked" state still carries the acknowledgement.
    expect(BOARD).toContain("lineMarked ? 'Marked");
  });
});

// ---------------------------------------------------------------------------
// 6. Comfortable targets and a clear finish
// ---------------------------------------------------------------------------

describe('the board is easy to use', () => {
  it('makes the whole line a generous target', () => {
    expect(BOARD).toContain('min-h-[56px] w-full');
    expect(BOARD).toContain('type-evidence font-medium uppercase');
  });

  it('says plainly when the draws are finished', () => {
    expect(BOARD).toContain('Four draws complete.');
    expect(BOARD).toMatch(/disabled=\{!allDone\}/);
    expect(BOARD).toContain('Cast Reading');
  });

  it('keeps the instruction calm and the warning visible', () => {
    expect(BOARD).toContain('Tap each line until you naturally stop.');
    expect(BOARD).toMatch(/type-body text-clay-light/);
  });
});

// ---------------------------------------------------------------------------
// 7. The working is actually readable
// ---------------------------------------------------------------------------

describe('method details typography', () => {
  it('defines the scale once, in rem so a reader’s own font size applies', () => {
    for (const token of ['.type-section', '.type-method', '.type-quote', '.type-body', '.type-evidence', '.type-verdict', '.type-meta']) {
      expect(GLOBALS, token).toContain(token);
    }
    const scale = GLOBALS.slice(GLOBALS.indexOf('.type-section'), GLOBALS.indexOf('@keyframes tap-pulse'));
    expect(scale).not.toMatch(/font-size:\s*\d+px/);
    expect((scale.match(/line-height:/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });

  it('uses the scale for every part of a method card', () => {
    for (const token of ['type-method', 'type-quote', 'type-evidence', 'type-verdict', 'type-meta', 'type-body']) {
      expect(DETAILS, token).toContain(token);
    }
  });

  it('leaves no 11-13px text behind in the working', () => {
    expect(DETAILS).not.toMatch(/text-\[(9|10|10\.5|11|12|12\.5|13)px\]/);
    expect(DETAILS).not.toMatch(/\btext-xs\b/);
  });

  it('presents the source as an excerpt rather than small print', () => {
    expect(DETAILS).toContain('<blockquote');
    expect(DETAILS).toContain('type-quote italic');
    expect(DETAILS).toContain('<cite');
    // …and with enough contrast to read.
    expect(DETAILS).toMatch(/type-quote italic text-sand\/7\d/);
  });

  it('labels the evidence so the eye can find it', () => {
    for (const label of ['Houses used', 'Working', 'Result figure']) {
      expect(DETAILS, label).toContain(label);
    }
  });

  it('keeps the verdict stronger than the arithmetic', () => {
    const verdictIndex = DETAILS.indexOf('type-verdict');
    const workingIndex = DETAILS.indexOf('type-evidence');
    expect(verdictIndex).toBeGreaterThan(workingIndex);
    expect(DETAILS).toMatch(/type-verdict text-sand-light/);
  });

  it('reads the same way on the result screen itself', () => {
    expect(repoFile('components/raml/reading/OutcomeCard.tsx')).toContain('type-body');
    expect(repoFile('components/raml/reading/InsufficientNotice.tsx')).toContain('type-body');
    expect(repoFile('components/raml/reading/ResultSummaryCard.tsx')).toContain('type-verdict');
  });

  it('leaves no 11-12px text anywhere on a reading', () => {
    // 11px eyebrows and notes were the real floor a reader met, not the
    // method details alone.
    for (const file of [
      'components/raml/reading/FigureCard.tsx',
      'components/raml/reading/MethodConsistencyCard.tsx',
      'components/raml/reading/ReadingHeader.tsx',
      'components/raml/reading/SupportingIndicators.tsx',
      'components/raml/reading/OutcomeCard.tsx',
      'components/raml/reading/InsufficientNotice.tsx',
      'components/raml/reading/CalculationDetails.tsx',
      'components/raml/reading/VerificationNotice.tsx',
      'components/raml/reading/ResultSummaryCard.tsx',
    ]) {
      expect(repoFile(file), file).not.toMatch(/text-\[(9|10|10\.5|11|12|12\.5|13)px\]/);
    }
    // Badges scale with the reader's font setting — and, since Prompt 18,
    // with the reader's chosen text size too.
    expect(repoFile('components/ui/Badge.tsx')).toContain('type-label');
  });

  it('keeps the working behind its disclosure control', () => {
    const view = repoFile('components/raml/EngineReadingView.tsx');
    expect(view).toContain('aria-expanded={showCalculation}');
    expect(view).toContain('How this was determined');
    expect(view).toMatch(/useState\(false\)/); // collapsed until asked for
  });
});
