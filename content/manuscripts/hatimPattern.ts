// The N-4/N-5/N-6 Hatim-construction pattern, tested against the source-
// verified cells only (Prompt 21, section 7). This module NEVER writes a
// value into hatim.ts — it only checks, for the four stars that have at
// least one verified variable cell, whether the pattern's implied N is
// self-consistent and which of the manuscript's own candidate numbers
// (its stated recitation count, or the Divine Name's Abjad sum) that N
// matches. For the twelve stars with no verified variable cells, the
// pattern is simply untestable — not "probably true".

import { HATIM_DEFINITIONS, arabicIndicToLatin, type HatimDefinition } from './hatim';
import { ABJAD_VALIDATIONS } from './abjad';

export type PatternStatus =
  | 'confirmed_by_source' // 2+ verified cells agree with each other AND with a manuscript-stated number
  | 'partially_confirmed' // exactly 1 verified cell, consistent with a manuscript-stated number
  | 'not_confirmed' // verified cell(s) present but match no manuscript-stated number
  | 'conflicting' // 2+ verified cells present but disagree with EACH OTHER
  | 'untestable'; // no verified variable cells to test the pattern against

interface ImpliedN {
  position: 'topMiddle' | 'middleLeft' | 'bottomRight';
  cellValue: number;
  /** N implied by this one cell under the formula (topMiddle+4, middleLeft+5, bottomRight+6). */
  impliedN: number;
}

export interface PatternDiagnostic {
  starId: string;
  sourceStatedValue: number;
  abjadValue: number;
  /** Only the topMiddle/middleLeft/bottomRight cells that are 'verified' in hatim.ts. */
  verifiedCells: ImpliedN[];
  /** The single N every verified cell agrees on, if they do; null if none verified or if they disagree. */
  consistentN: number | null;
  status: PatternStatus;
  note: string;
}

const OFFSET: Record<ImpliedN['position'], number> = { topMiddle: 4, middleLeft: 5, bottomRight: 6 };

function toLatin(text: string): number {
  return Number(arabicIndicToLatin(text));
}

function verifiedVariableCells(hatim: HatimDefinition): ImpliedN[] {
  const positions: ImpliedN['position'][] = ['topMiddle', 'middleLeft', 'bottomRight'];
  const out: ImpliedN[] = [];
  for (const position of positions) {
    const cell = hatim.border[position];
    if (cell.status !== 'verified') continue;
    const cellValue = toLatin(cell.text);
    out.push({ position, cellValue, impliedN: cellValue + OFFSET[position] });
  }
  return out;
}

function diagnose(hatim: HatimDefinition, sourceStatedValue: number, abjad: number): PatternDiagnostic {
  const verifiedCells = verifiedVariableCells(hatim);

  if (verifiedCells.length === 0) {
    return {
      starId: hatim.starId,
      sourceStatedValue,
      abjadValue: abjad,
      verifiedCells,
      consistentN: null,
      status: 'untestable',
      note: 'No variable Hatim cell is source-verified for this star yet, so the pattern cannot be tested.',
    };
  }

  const impliedNs = verifiedCells.map((c) => c.impliedN);
  const allAgree = impliedNs.every((n) => n === impliedNs[0]);

  if (!allAgree) {
    return {
      starId: hatim.starId,
      sourceStatedValue,
      abjadValue: abjad,
      verifiedCells,
      consistentN: null,
      status: 'conflicting',
      note: `The verified cells imply different N values under the formula (${verifiedCells
        .map((c) => `${c.position}=${c.cellValue} → N=${c.impliedN}`)
        .join(', ')}) — they do not agree with each other, so no single N is asserted.`,
    };
  }

  const n = impliedNs[0];
  const matchesStated = n === sourceStatedValue;
  const matchesAbjad = n === abjad;

  if (!matchesStated && !matchesAbjad) {
    return {
      starId: hatim.starId,
      sourceStatedValue,
      abjadValue: abjad,
      verifiedCells,
      consistentN: n,
      status: 'not_confirmed',
      note: `The verified cell(s) agree on N=${n}, but that matches neither the stated recitation count (${sourceStatedValue}) nor the Abjad sum (${abjad}).`,
    };
  }

  const against = matchesStated && matchesAbjad ? 'both the stated recitation count and the Abjad sum' : matchesStated ? 'the stated recitation count' : 'the Abjad sum';

  if (verifiedCells.length >= 2) {
    return {
      starId: hatim.starId,
      sourceStatedValue,
      abjadValue: abjad,
      verifiedCells,
      consistentN: n,
      status: 'confirmed_by_source',
      note: `All ${verifiedCells.length} verified cells agree on N=${n}, matching ${against}.`,
    };
  }

  return {
    starId: hatim.starId,
    sourceStatedValue,
    abjadValue: abjad,
    verifiedCells,
    consistentN: n,
    status: 'partially_confirmed',
    note: `Only one variable cell is verified; it is consistent with N=${n} (matching ${against}), but two of the three variable cells remain unverified.`,
  };
}

export const HATIM_PATTERN_DIAGNOSTICS: PatternDiagnostic[] = HATIM_DEFINITIONS.map((hatim) => {
  const abjad = ABJAD_VALIDATIONS.find((v) => v.starId === hatim.starId);
  return diagnose(hatim, abjad?.statedValue ?? 0, abjad?.computedValue ?? 0);
});

export function getPatternDiagnosticByStarId(starId: string): PatternDiagnostic | undefined {
  return HATIM_PATTERN_DIAGNOSTICS.find((d) => d.starId === starId);
}
