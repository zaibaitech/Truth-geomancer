import { FigureGlyph } from "@/components/raml/FigureGlyph";
import {
  CHART_HOUSE_GROUPS,
  CHAPTER_ONE_CHART,
} from "@/content/manuscripts/chapterOneDiagrams";

/** The complete sixteen-house chart built from this chapter's own worked
 * Mother Stars (the Cancelling Method's four examples), grouped by the
 * chapter's own terminology — Mothers, Daughters, Nieces, Witnesses,
 * Judge, Reconciler — all already used in the chapter's existing prose,
 * not new labels introduced here. Every figure comes from
 * CHAPTER_ONE_CHART, built by the protected engine's own buildChart(); no
 * value here is computed or guessed independently. Responsive: each group
 * wraps to as many columns as the viewport allows, never fewer than one. */
export function CompleteChartDiagram() {
  return (
    <div className="space-y-4">
      {CHART_HOUSE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="type-label uppercase tracking-widest text-sand/65">
            {group.label}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {group.houseNumbers.map((n) => {
              const house = CHAPTER_ONE_CHART.houses.find((h) => h.n === n);
              if (!house) return null;
              return (
                <div
                  key={n}
                  className="flex w-[70px] flex-col items-center gap-1 rounded-lg border border-sand/10 py-2.5"
                >
                  <FigureGlyph pattern={house.pattern} size="sm" />
                  <span className="type-label text-sand-light">H{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
