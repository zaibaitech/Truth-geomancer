import type { DotRow } from "@/content/stars";
import {
  ADDITION_SEQUENCE,
  PARITY_ADDITION_EXAMPLES,
} from "@/content/manuscripts/chapterOneDiagrams";

/** A single dot-row (one line of a figure, before it is stacked into a full
 * four-line Pattern) — used here because the parity rule combines two
 * single lines, not two complete figures, so FigureGlyph's fixed four-row
 * Pattern does not apply. */
function DotRowGlyph({ count }: { count: DotRow }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={count === 1 ? "1 dot" : "2 dots"}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="inline-block h-[7px] w-[7px] rounded-full bg-clay-light"
        />
      ))}
    </span>
  );
}

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

/** The house-combination sequence the source states in "In adding stars:"
 * (page 5) for building the full sixteen-house chart from the four
 * Mothers. Structural only — house numbers, no specific figure values —
 * since this is an educational restatement of the chart-building sequence
 * the protected engine already computes, not a re-derivation of it. */
export function AdditionSequenceDiagram() {
  return (
    <div className="space-y-4">
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
      <div>
        <p className="type-label uppercase tracking-widest text-sand/65">
          In adding stars
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ADDITION_SEQUENCE.map((step, i) => (
            <div
              key={i}
              className="rounded-full border border-sand/15 bg-ink px-2.5 py-1 type-label text-sand-light"
            >
              H{step.inputs[0]} + H{step.inputs[1]} → H{step.result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
