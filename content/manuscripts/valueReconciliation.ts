// Section 9's requested reconciliation model: makes explicit, per star, the
// three numbers the manuscript's own material can produce (a stated
// recitation count, a Divine-Name Abjad sum, and — only where the Hatim's
// own verified cells agree on one — a Hatim-construction number) rather than
// collapsing them into a single "the value" field. Derived entirely from
// starUses.ts, abjad.ts and hatimPattern.ts; nothing is stored twice — this
// is a read-only combination of those three canonical sources.

import { ABJAD_VALIDATIONS, abjadStatusLabel } from './abjad';
import { HATIM_PATTERN_DIAGNOSTICS } from './hatimPattern';

export type ValueConfidence = 'verified' | 'partial' | 'unresolved';

export interface ValueReconciliation {
  starId: string;
  sourceStatedValue: number;
  abjadValue: number;
  /** The N the Hatim's own verified cells agree on, if they do; null when
   * untestable (no verified variable cells) or conflicting (they disagree). */
  hatimReferenceValue: number | null;
  /** The precise, non-euphemistic status label from abjad.ts (section 10). */
  abjadStatus: string;
  valueMeaning: string;
  valueConfidence: ValueConfidence;
}

function reconcile(starId: string): ValueReconciliation {
  const abjad = ABJAD_VALIDATIONS.find((v) => v.starId === starId)!;
  const pattern = HATIM_PATTERN_DIAGNOSTICS.find((p) => p.starId === starId)!;
  const hatimReferenceValue = pattern.status === 'confirmed_by_source' || pattern.status === 'partially_confirmed' ? pattern.consistentN : null;

  let valueMeaning: string;
  let valueConfidence: ValueConfidence;

  if (abjad.status === 'match') {
    valueMeaning =
      hatimReferenceValue !== null
        ? `Source-stated recitation count, Abjad sum, and Hatim-construction number all agree (${abjad.statedValue}).`
        : `Source-stated recitation count and Abjad sum agree (${abjad.statedValue}); the Hatim's own variable cells are not yet verified enough to cross-check.`;
    valueConfidence = 'verified';
  } else if (abjad.status === 'partial_match') {
    valueMeaning = abjad.note ?? 'Only part of a multi-name invocation matches the stated count.';
    valueConfidence = 'partial';
  } else if (starId === 'ayuba') {
    valueMeaning = abjad.note ?? 'Stated count does not match the bare-name Abjad sum.';
    valueConfidence = 'verified'; // the *relationship* is understood, even though stated ≠ abjad
  } else {
    valueMeaning = abjad.note ?? 'Stated count does not match the bare-name Abjad sum, and no further explanation was found.';
    valueConfidence = 'unresolved';
  }

  return {
    starId,
    sourceStatedValue: abjad.statedValue,
    abjadValue: abjad.computedValue,
    hatimReferenceValue,
    abjadStatus: abjadStatusLabel(abjad),
    valueMeaning,
    valueConfidence,
  };
}

export const VALUE_RECONCILIATIONS: ValueReconciliation[] = ABJAD_VALIDATIONS.map((v) => reconcile(v.starId));

export function getValueReconciliationByStarId(starId: string): ValueReconciliation | undefined {
  return VALUE_RECONCILIATIONS.find((r) => r.starId === starId);
}
