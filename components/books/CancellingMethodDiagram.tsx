import { CANCELLING_METHOD_EXAMPLES } from "@/content/manuscripts/chapterOneDiagrams";

/** One typeset tally token, exactly as the source prints it: a lone stroke
 * for an uncancelled mark, a tight pair of strokes for a cancelled ("||")
 * pair. Rendered as thin bars rather than the literal "|"/"||" characters
 * so the cancelling — two marks struck together — reads visually, the way
 * the source's own hand-drawn cancellation lines do. */
function TallyToken({ token }: { token: string }) {
  const strokes = token.length; // '|' -> 1, '||' -> 2
  return (
    <span className="inline-flex items-end gap-[1.5px]" aria-hidden>
      {Array.from({ length: strokes }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[3px] rounded-sm bg-clay-light"
          style={{ height: 14 }}
        />
      ))}
    </span>
  );
}

/** The Cancelling Method's four worked examples (source page 5): four lines
 * of typeset tally tokens each, reproduced verbatim from the source's own
 * text layer. No remainder value is shown per line — the source itself
 * does not label one at this point in the text, so none is computed or
 * invented here; see chapterOneDiagrams.ts. */
export function CancellingMethodDiagram() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {CANCELLING_METHOD_EXAMPLES.map((example, i) => (
        <div
          key={i}
          className="rounded-xl border border-sand/10 bg-ink px-3 py-3"
        >
          <p className="type-label uppercase tracking-widest text-sand/65">
            {example.label}
          </p>
          <div
            className="mt-2 space-y-1.5"
            role="img"
            aria-label={`${example.label} tally lines`}
          >
            {example.lines.map((line, j) => (
              <div key={j} className="flex flex-wrap items-end gap-2">
                {line.map((token, k) => (
                  <TallyToken key={k} token={token} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
