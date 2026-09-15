import { FigureGlyph } from "@/components/raml/FigureGlyph";
import {
  COUNTING_DIRECTION_NOTE,
  COUNTING_METHOD_CLOSING,
  COUNTING_METHOD_EXAMPLES,
  starForCount,
  type CountingMethodExample,
  type CountingMethodLine,
} from "@/content/manuscripts/chapterOneDiagrams";

/** One counting line's row of literal dot marks — the source draws these as
 * an actual countable row, not a numeral alone. Rendered as small round
 * marks, distinct from the Cancelling Method's paired tally strokes: this
 * is a different technique (individual counted dots, not dots cancelled
 * two by two). */
function CountingMarks({ count }: { count: number }) {
  return (
    <div
      className="flex flex-wrap gap-1"
      role="img"
      aria-label={`${count} counted marks`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-clay-light"
        />
      ))}
    </div>
  );
}

/** One counting line, laid out the way the source shows it: its circled
 * number, the literal row of marks a reader can count, the arithmetic
 * (reduced where the source itself reduces it), and the resulting figure —
 * looked up from the existing STARS data, never redrawn or recomputed. The
 * star's name is exposed only as screen-reader-only text on the figure,
 * never as visible text: the source labels this line by its circled number,
 * not by a star's personal name (Prompt 28's source-fidelity correction).
 * Exported (Prompt 22) so CountingMethodPractice.tsx can reveal the same
 * lines one at a time instead of duplicating this markup. */
export function CountingLineRow({
  line,
  lineIndex,
}: {
  line: CountingMethodLine;
  lineIndex: number;
}) {
  const { name, pattern } = starForCount(line.reducedValue);
  return (
    <div className="rounded-lg border border-sand/10 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="type-method text-sand-light" aria-hidden>
          {line.circledNumber}
        </span>
        <span className="type-label text-sand/65">Line {lineIndex + 1}</span>
      </div>
      <div className="mt-2">
        <CountingMarks count={line.rawCount} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="type-label text-sand-light">
          {line.arithmeticLabel}
        </span>
        <FigureGlyph pattern={pattern} size="sm" />
        <span className="sr-only">Resulting figure: {name}</span>
      </div>
    </div>
  );
}

/** The source's own result display: the four figures redrawn on the right
 * in the order labelled "4 3 2 1" — the reverse of drawing order, matching
 * the source's stated counting direction (starting from the fourth line,
 * right to left). Each figure is the same lookup CountingLineRow already
 * uses for that line, shown a second time only because the source itself
 * shows it a second time as a small standalone result strip. */
export function ResultOrderStrip({ example }: { example: CountingMethodExample }) {
  return (
    <div className="mt-3 border-t border-sand/10 pt-3">
      <p className="type-label uppercase tracking-widest text-sand/65">
        Resulting stars — 4&emsp;3&emsp;2&emsp;1
      </p>
      <div
        className="mt-2 flex items-center justify-between gap-2"
        role="img"
        aria-label="The four resulting figures, in the source's own right-to-left display order 4, 3, 2, 1"
      >
        {example.resultOrder.map((lineNumber) => {
          const line = example.lines[lineNumber - 1];
          const { pattern } = starForCount(line.reducedValue);
          return (
            <div key={lineNumber} className="flex flex-col items-center gap-1">
              <FigureGlyph pattern={pattern} size="sm" />
              <span className="type-label text-sand/65" aria-hidden>
                {lineNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The Counting Method's two worked examples (source page 4), reproduced as
 * the manuscript itself demonstrates them: a countable row of marks, a
 * circled line number, the source's own arithmetic, and the resulting
 * figure for each of the four lines, followed by the source's own "4 3 2 1"
 * result strip. The source's own instruction on counting direction is
 * quoted between the two examples, where the source prints it. See
 * chapterOneDiagrams.ts for how the resulting figures were verified against
 * the source's own hand-drawn examples. */
export function CountingMethodDiagram() {
  return (
    <div className="space-y-4">
      {COUNTING_METHOD_EXAMPLES.map((example, i) => (
        <div key={i}>
          <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
            <p className="type-label uppercase tracking-widest text-sand/65">
              {example.label}
            </p>
            <div className="mt-2 space-y-2.5">
              {example.lines.map((line, j) => (
                <CountingLineRow key={j} line={line} lineIndex={j} />
              ))}
            </div>
            <ResultOrderStrip example={example} />
          </div>
          {i === 0 ? (
            <p className="mt-3 type-evidence italic text-sand/70">
              {COUNTING_DIRECTION_NOTE}
            </p>
          ) : null}
        </div>
      ))}
      <p className="type-evidence italic text-sand/65">
        {COUNTING_METHOD_CLOSING}
      </p>
    </div>
  );
}
