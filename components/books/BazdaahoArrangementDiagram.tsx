import { FigureGlyph } from "@/components/raml/FigureGlyph";
import { BAZDAAHO_ARRANGEMENT } from "@/content/manuscripts/chapterOneDiagrams";
import { STARS } from "@/content/stars";

/** The complete Bazdaaho arrangement (page 6): all sixteen stars, in the
 * source's own three printed rows and its own left-to-right order within
 * each row — not renumbered or resorted ascending. Every figure is looked
 * up from the existing, already-canonical STARS array by number; nothing
 * here defines a figure a second time. Cards wrap via flexbox rather than
 * a fixed grid, so the eight-star top row reflows to fewer per line on
 * narrow viewports (the "responsive two-stage presentation" this section
 * calls for) while the source's own row grouping and ordering stay
 * visible and unchanged. */
export function BazdaahoArrangementDiagram() {
  return (
    <div className="space-y-4">
      {BAZDAAHO_ARRANGEMENT.map((group) => (
        <div key={group.label}>
          <p className="type-label uppercase tracking-widest text-sand/65">
            {group.label}
          </p>
          <div
            className="mt-2 flex flex-wrap gap-2"
            role="img"
            aria-label={`${group.label}, in the manuscript's own printed order: ${group.starNumbers.join(", ")}`}
          >
            {group.starNumbers.map((n) => {
              const star = STARS.find((s) => s.number === n);
              if (!star) return null;
              return (
                <div
                  key={n}
                  className="flex w-[68px] flex-col items-center gap-1 rounded-lg border border-sand/10 py-2.5"
                >
                  <FigureGlyph pattern={star.pattern} size="sm" />
                  <span className="type-label text-sand-light">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
