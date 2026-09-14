import { DotRowGlyph, FigureGlyph } from "@/components/raml/FigureGlyph";
import type { DotRow } from "@/content/stars";
import {
  CANCELLING_METHOD_MOTHER_PATTERNS,
  CHAPTER_ONE_ADDITION_STEPS,
  CHAPTER_ONE_DAUGHTERS,
  PARITY_ADDITION_EXAMPLES,
} from "@/content/manuscripts/chapterOneDiagrams";

/** The parity rule the source states for combining any two lines into one
 * — restated here as a small worked figure, not a new rule (matches the
 * existing chapter prose and the protected engine's addRows() exactly). */
function ParityExample({
  a,
  b,
  result,
}: {
  a: DotRow;
  b: DotRow;
  result: DotRow;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-sand/10 px-2.5 py-2">
      <DotRowGlyph count={a} />
      <span className="type-label text-sand/65">+</span>
      <DotRowGlyph count={b} />
      <span className="type-label text-sand/65">=</span>
      <DotRowGlyph count={result} />
    </div>
  );
}

/** One step of the "In adding stars" chain, with real figures — looked up
 * from this chapter's own chart (built from the Cancelling Method's four
 * worked Mother Stars via the protected engine's buildChart/addPatterns),
 * not abstract placeholders. */
function AdditionStep({
  step,
}: {
  step: (typeof CHAPTER_ONE_ADDITION_STEPS)[number];
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-sand/10 px-2.5 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <FigureGlyph pattern={step.inputPatterns[0]} size="sm" />
          <span className="type-label text-sand/65">H{step.inputs[0]}</span>
        </div>
        <span className="type-label text-sand/65">+</span>
        <div className="flex flex-col items-center gap-1">
          <FigureGlyph pattern={step.inputPatterns[1]} size="sm" />
          <span className="type-label text-sand/65">H{step.inputs[1]}</span>
        </div>
        <span className="type-label text-sand/65">→</span>
        <div className="flex flex-col items-center gap-1">
          <FigureGlyph pattern={step.resultPattern} size="sm" />
          <span className="type-label text-sand-light">H{step.result}</span>
        </div>
      </div>
    </div>
  );
}

/** From this chapter's own four Mother Stars (the Cancelling Method's
 * worked examples) to the four Daughters (Banaat): each Daughter is read
 * across the Mothers' corresponding line, not added pair-by-pair — the
 * chapter's own prose already says so ("drawn out by combining the
 * Mothers' corresponding lines"); this shows that same derivation, via
 * deriveDaughters (the protected engine's own function), with real
 * figures rather than restating it as prose alone. */
function MothersToDaughters() {
  return (
    <div>
      <p className="type-label uppercase tracking-widest text-sand/65">
        From Mothers to Daughters (Banaat)
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex gap-1.5">
          {CANCELLING_METHOD_MOTHER_PATTERNS.map((pattern, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <FigureGlyph pattern={pattern} size="sm" />
              <span className="type-label text-sand/65">H{i + 1}</span>
            </div>
          ))}
        </div>
        <span className="type-label self-center text-sand/65">→</span>
        <div className="flex gap-1.5">
          {CHAPTER_ONE_DAUGHTERS.map((pattern, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <FigureGlyph pattern={pattern} size="sm" />
              <span className="type-label text-sand-light">H{i + 5}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The house-combination sequence the source states in "In adding stars:"
 * (page 5) for building the full sixteen-house chart from the four
 * Mothers — the parity rule, the Mothers-to-Daughters derivation, and the
 * H1+H2→H9 … H15+H1→H16 chain, all shown with this chapter's own real
 * figures (built from the Cancelling Method's four worked Mother Stars via
 * the protected engine, never re-derived by hand here). */
export function AdditionSequenceDiagram() {
  return (
    <div className="space-y-5">
      <div>
        <p className="type-label uppercase tracking-widest text-sand/65">
          Combining two lines
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PARITY_ADDITION_EXAMPLES.map((ex, i) => (
            <ParityExample key={i} {...ex} />
          ))}
        </div>
      </div>
      <MothersToDaughters />
      <div>
        <p className="type-label uppercase tracking-widest text-sand/65">
          In adding stars
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CHAPTER_ONE_ADDITION_STEPS.map((step, i) => (
            <AdditionStep key={i} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
}
