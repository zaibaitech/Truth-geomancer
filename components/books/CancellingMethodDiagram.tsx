import { DotRowGlyph, FigureGlyph } from "@/components/raml/FigureGlyph";
import {
  CANCEL_DIRECTION_LABEL,
  CANCELLING_METHOD_CLOSING,
  CANCELLING_METHOD_EXAMPLES,
  cancelledLineMark,
  cancellingMotherPattern,
  type CancellingMethodExample,
} from "@/content/manuscripts/chapterOneDiagrams";

function totalDots(tokens: string[]): number {
  return tokens.reduce((sum, t) => sum + t.length, 0);
}

/** A single, uncancelled dot in the "original line" step — plain, no
 * grouping, just a countable row. */
function PlainDots({ count }: { count: number }) {
  return (
    <div
      className="flex flex-wrap gap-1"
      role="img"
      aria-label={`${count} dots before cancellation`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-clay-light/80"
        />
      ))}
    </div>
  );
}

/** One typeset token from the source, shown mid-cancellation: a "||" pair
 * is struck through (cancelled), a lone "|" is left plain (it survives the
 * cancelling). The struck pairs and the surviving single are the same
 * tokens transcribed in chapterOneDiagrams.ts — nothing here reorders or
 * invents them, it only adds the strike to show which are cancelled. */
function CancelToken({ token }: { token: string }) {
  const dots = token.length;
  const cancelled = dots === 2;
  return (
    <span className="relative inline-flex items-center gap-[3px] px-0.5">
      {Array.from({ length: dots }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-clay-light"
        />
      ))}
      {cancelled ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-clay-light/80"
          style={{ transform: "translateY(-50%) rotate(-14deg)" }}
        />
      ) : null}
    </span>
  );
}

/** One counting line's full cancellation flow, exactly as the manuscript
 * teaches it: the original line of dots, the same dots grouped and
 * cancelled two by two (a struck-through pair per cancellation, a
 * surviving single left plain), the dot or two left over, and that
 * remainder restated as the line's formal mark. All four stages show the
 * same underlying value derived from the tokens already transcribed in
 * chapterOneDiagrams.ts (see cancelledLineMark) — nothing here computes a
 * new number, only displays the existing one in four ways. */
function CancellingLineFlow({
  tokens,
  lineIndex,
}: {
  tokens: string[];
  lineIndex: number;
}) {
  const mark = cancelledLineMark(tokens);
  const total = totalDots(tokens);
  return (
    <div className="rounded-lg border border-sand/10 px-3 py-2.5">
      <p className="type-label text-sand/65">Line {lineIndex + 1}</p>

      <div className="mt-2">
        <p className="type-label text-sand/65">Original line — {total} dots</p>
        <div className="mt-1">
          <PlainDots count={total} />
        </div>
      </div>

      <p className="mt-2 text-center type-label text-sand/65" aria-hidden>
        ↓
      </p>

      <div>
        <p className="type-label uppercase tracking-widest text-sand/65">
          {CANCEL_DIRECTION_LABEL}
        </p>
        <div
          className="mt-1 flex flex-wrap-reverse items-center justify-end gap-1"
          role="img"
          aria-label={`Line ${lineIndex + 1}: pairs cancelled from right to left, ${
            mark === 1 ? "one dot remains" : "two dots remain"
          }`}
        >
          {tokens.map((token, i) => (
            <CancelToken key={i} token={token} />
          ))}
        </div>
      </div>

      <p className="mt-2 text-center type-label text-sand/65" aria-hidden>
        ↓
      </p>

      <div>
        <p className="type-label text-sand/65">
          Remaining — {mark === 1 ? "one dot" : "two dots"}
        </p>
        <div className="mt-1">
          <PlainDots count={mark} />
        </div>
      </div>

      <p className="mt-2 text-center type-label text-sand/65" aria-hidden>
        ↓
      </p>

      <div className="flex items-center gap-2">
        <p className="type-label text-sand/65">Line mark</p>
        <DotRowGlyph count={mark} size="md" />
      </div>
    </div>
  );
}

/** One worked Cancelling Method example: its four lines' full cancellation
 * flow, followed by the resulting Mother Star (the four lines' marks,
 * stacked top to bottom). */
function CancellingExampleBlock({
  example,
  motherNumber,
}: {
  example: CancellingMethodExample;
  motherNumber: number;
}) {
  const motherPattern = cancellingMotherPattern(example);
  return (
    <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
      <p className="type-label uppercase tracking-widest text-sand/65">
        {example.label}
      </p>
      <div className="mt-2 space-y-2.5">
        {example.lines.map((tokens, i) => (
          <CancellingLineFlow key={i} tokens={tokens} lineIndex={i} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-sand/10 pt-3">
        <FigureGlyph pattern={motherPattern} size="md" />
        <span className="type-method text-sand-light">
          Mother Star {motherNumber}
        </span>
      </div>
    </div>
  );
}

/** The Cancelling Method's four worked examples (source page 5), redrawn as
 * a clear step-by-step tutorial rather than a static reproduction of the
 * source's typeset tally marks: each line's original dots, the same dots
 * cancelled in pairs from right to left, what remains, and the resulting
 * mark — then the four lines' marks stacked into that example's own Mother
 * Star. The underlying tokens and the exact method are unchanged from the
 * source; only the presentation is new. See chapterOneDiagrams.ts for how
 * each line's mark is derived from those same tokens. */
export function CancellingMethodDiagram() {
  return (
    <div className="space-y-4">
      {CANCELLING_METHOD_EXAMPLES.map((example, i) => (
        <CancellingExampleBlock
          key={i}
          example={example}
          motherNumber={i + 1}
        />
      ))}
      <p className="type-evidence italic text-sand/70">
        {CANCELLING_METHOD_CLOSING}
      </p>
    </div>
  );
}
