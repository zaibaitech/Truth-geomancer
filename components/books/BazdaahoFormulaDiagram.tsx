import {
  BAZDAAHO_EG1_NOTE,
  BAZDAAHO_FORMULA_TABLE,
  BAZDAAHO_WORKED_EXAMPLES,
} from "@/content/manuscripts/chapterOneDiagrams";

/** The Bazdaaho formula's letter-to-value table and its four worked
 * examples (source page 6), reproduced exactly as printed — including one
 * character ("Ͻ") the extraction could not resolve to a standard Arabic
 * letterform, and Eg. 1's own working line summing three of the table's
 * four values rather than all four. Neither is corrected here; see
 * chapterOneDiagrams.ts. */
export function BazdaahoFormulaDiagram() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
        <p className="type-label uppercase tracking-widest text-sand/65">
          Letter values
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {BAZDAAHO_FORMULA_TABLE.map((letter, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-lg border border-sand/10 py-2.5"
            >
              <span className="type-method text-sand-light" dir="rtl" lang="ar">
                {letter.arabic}
              </span>
              <span className="type-label text-sand/65">{letter.value}</span>
            </div>
          ))}
        </div>
        {BAZDAAHO_FORMULA_TABLE.some((l) => l.note) ? (
          <p className="mt-2 type-evidence italic text-sand/65">
            {BAZDAAHO_FORMULA_TABLE.find((l) => l.note)?.note}
          </p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {BAZDAAHO_WORKED_EXAMPLES.map((ex, i) => (
          <div
            key={i}
            className="rounded-xl border border-sand/10 bg-ink px-3 py-2.5"
          >
            <p className="type-label uppercase tracking-widest text-sand/65">
              {ex.label}
            </p>
            <p className="mt-1 type-body text-sand-light">{ex.workingLine}</p>
          </div>
        ))}
        <p className="type-evidence italic text-sand/65">{BAZDAAHO_EG1_NOTE}</p>
      </div>
    </div>
  );
}
