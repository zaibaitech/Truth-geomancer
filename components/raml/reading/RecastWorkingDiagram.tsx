import type { ReadingMethodRow } from '@/lib/raml/engine/reading';

/** Recast-working diagram (Prompt 74). Renders in place of the plain
 * "Houses used" / "Working" text whenever a method's own casting metadata
 * says `inspects.kind === 'recast'` (CalculationDetails decides that; this
 * component only draws it) — driven entirely by `method.casting` (enums and
 * house numbers, set generically in reading.ts for every method). Never a
 * question id, chapter number, or hard-coded house/figure name, so any
 * chapter whose casting metadata is marked `recast` gets this same
 * presentation for free. Stops at "inspected on the second chart" — the
 * existing, unchanged "Result figure" block right below this one already
 * shows the figure that inspection found, so this never duplicates it.
 *
 * Why this exists: a plain "Houses used: H3, H7, H11, H15"-style line (still
 * what every non-recast method shows) reads identically whether those
 * houses were combined directly or, as here, used only to seed an entirely
 * separate second chart. This makes that second step explicit instead of
 * leaving it to a single sentence buried in the calculation trace. */
export function RecastWorkingDiagram({ method }: { method: ReadingMethodRow }) {
  const motherHouses = method.casting.recastMotherHouses ?? [];
  const thenHouses = method.casting.recastThenHouses ?? [];

  return (
    <div className="mt-3 rounded-xl border border-sand/15 bg-ink px-4 py-4">
      <p className="type-meta uppercase tracking-widest text-sand/65">Recast working</p>

      <div className="mt-2">
        <p className="type-meta text-sand/65">Original chart</p>
        <p className="type-evidence font-medium text-sand-light">
          {motherHouses.length > 0 ? motherHouses.map((n) => `H${n}`).join(' + ') : 'Houses from the original chart'}
        </p>
      </div>

      <p aria-hidden className="my-1.5 text-sand/65">
        ↓
      </p>
      <p className="type-evidence text-sand/70">Used as new Mothers — not a second casting by you</p>

      <p aria-hidden className="my-1.5 text-sand/65">
        ↓
      </p>
      <p className="type-evidence text-sand/70">A second, separate 16-house chart</p>

      {thenHouses.length > 0 ? (
        <>
          <p aria-hidden className="my-1.5 text-sand/65">
            ↓
          </p>
          <div>
            <p className="type-meta text-sand/65">Inspected on that second chart</p>
            <p className="type-evidence font-medium text-sand-light">
              {thenHouses.map((n) => `H${n} of the second chart`).join(', ')}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
