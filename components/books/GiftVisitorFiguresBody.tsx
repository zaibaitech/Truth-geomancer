import { FigureGlyph } from "@/components/raml/FigureGlyph";
import {
  getGiftVisitorFigurePattern,
  getGiftVisitorFigureStarId,
  parseGiftVisitorParagraph,
} from "@/content/manuscripts/giftVisitorFigures";
import { STARS } from "@/content/stars";

/** One recovered occurrence's own marker text ("If you get" / "If you
 * get:" / "If you use the method above and get"), immediately followed by
 * its figure — restoring the position the source itself leaves for it,
 * right before the comma that starts the meaning. */
function GiftVisitorItem({
  number,
  markerText,
  rest,
}: {
  number: number;
  markerText: string;
  rest: string;
}) {
  const pattern = getGiftVisitorFigurePattern(number);
  const starId = getGiftVisitorFigureStarId(number);
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

/** "Reading the Gift/Visitor Figures" — the continuation of Chapter 28,
 * stored as two chapter entries in content/manuscripts/kanzul-mikban.ts,
 * split at each of their own unmarked "If you get[:]" occurrences so the
 * figure the source leaves room for can be restored in position. Not a
 * single word is rewritten: every character of every paragraph is
 * reproduced via `lead` and each item's `markerText` + `rest`, exactly as
 * parseGiftVisitorParagraph finds them — this component only decides
 * where the figure goes, never what the text says. `startNumber` lets the
 * second chapter entry continue this restoration's own numbering (7, 8)
 * where the first (1-6) leaves off — see content/manuscripts/
 * giftVisitorFigures.ts for how each figure was identified and matched to
 * the existing canonical STARS data, and for why entry #6 has no figure
 * of its own printed a second time on this second chapter's page: the
 * source's own sentence for it starts on the first chapter's page and
 * simply continues onto this one, unmarked. */
export function GiftVisitorFiguresBody({
  paragraphs,
  startNumber = 1,
}: {
  paragraphs: string[];
  startNumber?: number;
}) {
  let next = startNumber;
  return (
    <div>
      {paragraphs.map((paragraph, pi) => {
        const { lead, items } = parseGiftVisitorParagraph(paragraph, next);
        next += items.length;
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
                  <GiftVisitorItem
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
