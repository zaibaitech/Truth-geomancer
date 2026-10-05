import { StarChip } from "@/components/books/StarProseParagraph";
import { parseBodyPartTable } from "@/lib/raml/kanzulStarText";
import { STARS } from "@/content/stars";

/** Chapter 106, "Parts of the Human Body and the Stars Representing Them": the
 * edition's own two-column table, in the order printed (1, 10, 2, 11, ...), one
 * row per two entries. Every number, label and figure is the edition's — the
 * printed anomalies (Sulemana for both Head and Neck, no Adam) are shown as
 * printed. */
export function BodyPartTable({ text }: { text: string }) {
  const rows = parseBodyPartTable(text);
  if (!rows) return null;
  return (
    <ul className="mb-5 grid grid-cols-2 gap-x-3 gap-y-4">
      {rows.map((r) => (
        <li key={r.n} className="min-w-0">
          <p className="type-body text-sand/80">
            {r.n}. {r.label} —
          </p>
          {r.starId ? (
            <div className="mt-1">
              <StarChip starId={r.starId} name={STARS.find((s) => s.id === r.starId)!.name} wrap />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
