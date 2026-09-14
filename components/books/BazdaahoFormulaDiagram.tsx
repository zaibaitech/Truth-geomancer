import { FigureGlyph } from "@/components/raml/FigureGlyph";
import {
  BAZDAAHO_EG1_NOTE,
  BAZDAAHO_FORMULA_TABLE,
  BAZDAAHO_METHOD_INTRO,
  BAZDAAHO_WORKED_EXAMPLES,
  starForBazdaahoResult,
} from "@/content/manuscripts/chapterOneDiagrams";

/** The Bazdaaho formula's letter-to-value table (page 6), shown as the
 * source itself lays it out: four rows, each carrying the source's own
 * "I"/"II" row mark, its Arabic letter (or, for one row, the unresolved
 * glyph "Ͻ" — flagged, not guessed at), and its value. A grid of four
 * equal columns would flatten that row structure; this keeps it as rows. */
function FormulaTable() {
  return (
    <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
      <p className="type-label uppercase tracking-widest text-sand/65">
        The formula
      </p>
      <div className="mt-2 space-y-1.5">
        {BAZDAAHO_FORMULA_TABLE.map((letter, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-sand/10 px-3 py-2"
          >
            <span className="type-label w-5 shrink-0 text-sand/65">
              {letter.rowLabel}
            </span>
            <span className="type-method text-sand-light" dir="rtl" lang="ar">
              {letter.arabic}
            </span>
            <span className="type-label text-sand/65">=</span>
            <span className="type-body text-sand-light">{letter.value}</span>
          </div>
        ))}
      </div>
      {BAZDAAHO_FORMULA_TABLE.some((l) => l.note) ? (
        <p className="mt-2 type-evidence italic text-sand/65">
          {BAZDAAHO_FORMULA_TABLE.find((l) => l.note)?.note}
        </p>
      ) : null}
    </div>
  );
}

/** One worked example: its source arithmetic alongside the actual
 * four-line figure the result value maps to (starForBazdaahoResult, which
 * reuses the existing STARS data — this is a lookup, not a second
 * star-definition or a recomputation of the star's own pattern). */
function WorkedExample({
  example,
}: {
  example: (typeof BAZDAAHO_WORKED_EXAMPLES)[number];
}) {
  const { pattern } = starForBazdaahoResult(example.result);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sand/10 bg-ink px-3 py-2.5">
      <FigureGlyph pattern={pattern} size="sm" />
      <div>
        <p className="type-label uppercase tracking-widest text-sand/65">
          {example.label}
        </p>
        <p className="mt-1 type-body text-sand-light">{example.workingLine}</p>
      </div>
    </div>
  );
}

/** The Bazdaaho formula and its four worked examples (source page 6),
 * reproduced exactly as printed: the source's own transition sentence, its
 * four-row letter-value formula (including one glyph the extraction could
 * not resolve, flagged rather than guessed at), and each example's actual
 * resulting figure alongside its source arithmetic — including Eg. 1's own
 * working line, whose stated total does not match the sum of the four
 * values it lists. Neither the glyph nor the arithmetic is corrected here;
 * see chapterOneDiagrams.ts. */
export function BazdaahoFormulaDiagram() {
  return (
    <div className="space-y-4">
      <p className="italic type-body text-sand-light">
        {BAZDAAHO_METHOD_INTRO}
      </p>

      <FormulaTable />

      <div className="space-y-2.5">
        {BAZDAAHO_WORKED_EXAMPLES.map((ex, i) => (
          <WorkedExample key={i} example={ex} />
        ))}
        <p className="type-evidence italic text-sand/65">{BAZDAAHO_EG1_NOTE}</p>
      </div>
    </div>
  );
}
