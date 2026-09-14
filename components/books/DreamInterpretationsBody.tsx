import { FigureGlyph } from "@/components/raml/FigureGlyph";
import {
  getDreamInterpretationPattern,
  getDreamInterpretationStarId,
  parseDreamParagraph,
} from "@/content/manuscripts/dreamInterpretations";
import { STARS } from "@/content/stars";

/** One interpretation's own marker text ("N. If it's" or "N. If it's:"),
 * immediately followed by its figure — restoring the position the source
 * itself places the figure in, between the marker and the comma that
 * starts the interpretation's meaning. */
function DreamItem({
  number,
  markerText,
  rest,
}: {
  number: number;
  markerText: string;
  rest: string;
}) {
  const pattern = getDreamInterpretationPattern(number);
  const starId = getDreamInterpretationStarId(number);
  const starName = STARS.find((s) => s.id === starId)?.name ?? starId;
  return (
    <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="type-body text-sand-light">{markerText}</span>
        <FigureGlyph pattern={pattern} size="sm" />
        <span className="sr-only">({starName})</span>
        <span className="type-body leading-[1.7] text-sand/80">{rest}</span>
      </div>
    </div>
  );
}

/** Chapter 151, "Dreams and Their Interpretations" — the same paragraph
 * text content/manuscripts/kanzul-mikban.ts already stores, split at each
 * of its own "N. If it's[:]" markers so the figure the source draws there
 * can be restored in position. Not a single word is rewritten: every
 * character of every paragraph is reproduced via `lead` and each item's
 * `markerText` + `rest`, exactly as parseDreamParagraph finds them —
 * this component only decides where the figure goes, never what the text
 * says. See dreamInterpretations.ts for how each figure was identified
 * and matched to the existing canonical STARS data. */
export function DreamInterpretationsBody({
  paragraphs,
}: {
  paragraphs: string[];
}) {
  return (
    <div>
      {paragraphs.map((paragraph, pi) => {
        const { lead, items } = parseDreamParagraph(paragraph);
        return (
          <div key={pi} className="mb-5 last:mb-0">
            {lead ? (
              <p className="mb-4 type-body leading-[1.7] text-sand/80">
                {lead}
              </p>
            ) : null}
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <DreamItem
                    key={item.number}
                    number={item.number}
                    markerText={item.markerText}
                    rest={item.rest}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
