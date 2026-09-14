import { DotRowGlyph, FigureGlyph } from "@/components/raml/FigureGlyph";
import {
  BAZDAAHO_ALL_ACTIVE_VALIDATION,
  BAZDAAHO_CALCULATION_RULE_NOTE,
  BAZDAAHO_EG1_NOTE,
  BAZDAAHO_FORMULA_TABLE,
  BAZDAAHO_LINE_VALUES,
  BAZDAAHO_METHOD_INTRO,
  BAZDAAHO_WORKED_EXAMPLES,
  type BazdaahoWorkedExample,
  starForBazdaahoResult,
} from "@/content/manuscripts/chapterOneDiagrams";
import type { DotRow } from "@/content/stars";

/** The Bazdaaho formula's letter-to-value table (page 6): four rows, each
 * carrying the source's own "I"/"II" row mark, its line/element label, its
 * independently-verified Arabic letter, and its value. Where the source
 * itself prints a different character for a letter (see
 * chapterOneDiagrams.ts), that literal source glyph is shown too, clearly
 * marked apart from the verified letter — never presented as if the
 * manuscript printed the verified letter directly. */
function FormulaTable() {
  return (
    <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
      <p className="type-label uppercase tracking-widest text-sand/65">
        Formula
      </p>
      <div className="mt-2 space-y-1.5">
        {BAZDAAHO_FORMULA_TABLE.map((letter, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-sand/10 px-3 py-2"
          >
            <span className="type-label w-12 shrink-0 text-sand/65">
              {letter.lineLabel.split(" — ")[0]}
            </span>
            <DotRowGlyph count={(letter.rowLabel === "II" ? 2 : 1) as DotRow} />
            <span className="type-method text-sand-light" dir="rtl" lang="ar">
              {letter.arabic}
            </span>
            <span className="type-label text-sand/65">=</span>
            <span className="type-body text-sand-light">{letter.value}</span>
          </div>
        ))}
      </div>
      {BAZDAAHO_FORMULA_TABLE.some((l) => l.sourcePrintedAs) ? (
        <p className="mt-2 type-evidence italic text-sand/65">
          Independent verification: the source page itself prints{" "}
          {BAZDAAHO_FORMULA_TABLE.filter((l) => l.sourcePrintedAs)
            .map((l) => `"${l.sourcePrintedAs}"`)
            .join(" and ")}{" "}
          for these two letters rather than clean Arabic script; the letters
          shown above (د, ح) are identified from their Abjad numeral values (4
          and 8 respectively), which belong to no other Arabic letter.
        </p>
      ) : null}
    </div>
  );
}

/** The general derivation rule (page 6), in the order a reader needs it:
 * the plain-language rule first, then each line's own one-dot/two-dot
 * contribution spelled out. */
function CalculationRule() {
  return (
    <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
      <p className="type-label uppercase tracking-widest text-sand/65">
        How the calculation works
      </p>
      <p className="mt-2 type-body text-sand/80">
        {BAZDAAHO_CALCULATION_RULE_NOTE}
      </p>
      <div className="mt-3 space-y-1.5">
        {BAZDAAHO_FORMULA_TABLE.map((letter, i) => (
          <p key={i} className="type-body text-sand/80">
            {letter.lineLabel.split(" — ")[0]}: one point →{" "}
            <span className="text-sand-light">+{letter.value}</span>; two points
            → <span className="text-sand-light">+0</span>
          </p>
        ))}
      </div>
    </div>
  );
}

/** One worked example, shown so the reader can see exactly how the source
 * arrived at its number: the actual four-line figure with each line's own
 * contribution named beside it (active lines show their value, inactive
 * lines show +0), then the calculation, reduction and resulting position,
 * then the canonical star name that position already has in STARS —
 * looked up via starForBazdaahoResult, never recomputed. */
function WorkedExample({
  example,
  independent = false,
}: {
  example: BazdaahoWorkedExample;
  independent?: boolean;
}) {
  const { name, pattern } = starForBazdaahoResult(example.result);
  return (
    <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
      <div className="flex items-center justify-between">
        <p className="type-label uppercase tracking-widest text-sand/65">
          {example.label}
        </p>
        {independent ? (
          <span className="type-evidence italic text-sand/65">
            independent verification
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex gap-4">
        <FigureGlyph pattern={pattern} size="md" />
        <div className="space-y-1">
          {pattern.map((dots, i) => (
            <p key={i} className="flex items-center gap-2 type-evidence">
              <DotRowGlyph count={dots} />
              <span className={dots === 1 ? "text-sand-light" : "text-sand/65"}>
                {dots === 1 ? `+${BAZDAAHO_LINE_VALUES[i]}` : "+0"}
              </span>
            </p>
          ))}
        </div>
      </div>
      <p className="mt-2 type-body text-sand-light">{example.workingLine}</p>
      <p className="mt-1 type-evidence text-sand/65">
        Position {example.result} — {name}
      </p>
    </div>
  );
}

/** The Bazdaaho formula and its worked examples (source page 6): the
 * source's own transition sentence, its four-row letter-value formula, the
 * general derivation rule, the source's own four worked examples (each
 * showing its figure's per-line contribution, calculation, reduction and
 * resulting star), and — clearly marked as independent verification rather
 * than source text — the one case the source page does not happen to
 * demonstrate: a figure with all four lines active. See
 * chapterOneDiagrams.ts for the full source-vs-verification notes. */
export function BazdaahoFormulaDiagram() {
  return (
    <div className="space-y-4">
      <p className="italic type-body text-sand-light">
        {BAZDAAHO_METHOD_INTRO}
      </p>

      <FormulaTable />

      <CalculationRule />

      <div className="space-y-2.5">
        {BAZDAAHO_WORKED_EXAMPLES.map((ex, i) => (
          <WorkedExample key={i} example={ex} />
        ))}
      </div>

      <p className="type-evidence italic text-sand/65">{BAZDAAHO_EG1_NOTE}</p>

      <WorkedExample example={BAZDAAHO_ALL_ACTIVE_VALIDATION} independent />
    </div>
  );
}
