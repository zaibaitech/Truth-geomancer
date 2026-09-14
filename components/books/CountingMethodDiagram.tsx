import { FigureGlyph } from "@/components/raml/FigureGlyph";
import {
  COUNTING_METHOD_CLOSING,
  COUNTING_METHOD_EXAMPLES,
  starForCount,
} from "@/content/manuscripts/chapterOneDiagrams";

/** The Counting Method's two worked examples (source page 4): four tally
 * lines each, the raw count the source states for every line, and the
 * resulting star figure — looked up from the same STARS data the rest of
 * the app already uses, not redrawn or re-guessed here. See
 * chapterOneDiagrams.ts for how that lookup was verified against the
 * source's own hand-drawn figures. */
export function CountingMethodDiagram() {
  return (
    <div className="space-y-5">
      {COUNTING_METHOD_EXAMPLES.map((example, i) => (
        <div
          key={i}
          className="rounded-xl border border-sand/10 bg-ink px-3 py-3"
        >
          <p className="type-label uppercase tracking-widest text-sand/65">
            {example.label}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {example.lines.map((line, j) => {
              const { name, pattern } = starForCount(line.reducedValue);
              return (
                <div
                  key={j}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-sand/10 py-2.5"
                >
                  <span className="type-label text-sand/65">
                    {line.rawLabel}
                  </span>
                  <FigureGlyph pattern={pattern} size="sm" />
                  <span className="type-label text-sand-light">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="type-evidence italic text-sand/65">
        {COUNTING_METHOD_CLOSING}
      </p>
    </div>
  );
}
