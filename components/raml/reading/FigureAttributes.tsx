import { describeFigureAttributes, type FigureFacts, type InterpretationBasis } from '@/lib/raml/interpretationBasis';
import {
  figureQualityNotes,
  figureQualityText,
  KANZUL_QUALITY_PROVENANCE_NOTE,
  type FigureQualityContext,
} from '@/content/kanzulFigureQuality';

/**
 * A figure's attributes, shown by what the method actually used. The
 * attribute the method's rule reads is emphasised under its basis label
 * ("Element: Fire", "Method's own rule"); everything else is plain muted
 * context — never a competing verdict.
 *
 * For a star-quality method the deciding fact is "Figure quality: …", taken
 * from the Kanzul contextual layer (never the global Western table), with a
 * provenance note saying that classification is context from another source
 * and not Kanzul's own list. An unresolved figure shows "Not classified", never
 * a guessed quality. Where the existing engine calculated the result with a
 * different (or unconfirmed) quality, a note names the quality it actually used. Unknown basis (legacy data) keeps the old plain list.
 */
export function FigureAttributes({
  basis,
  facts,
  quality,
  className = 'type-meta text-sand/65',
}: {
  basis: InterpretationBasis | null | undefined;
  facts: FigureFacts;
  /** Contextual Kanzul quality for a star-quality method. */
  quality?: FigureQualityContext | null;
  className?: string;
}) {
  const starQuality = basis === 'star_quality';
  // The Western good/bad word never appears for a star-quality method: the
  // contextual quality replaces it.
  const { basisLabel, deciding, other } = describeFigureAttributes(basis, starQuality ? { ...facts, fortune: null } : facts);
  if (!basisLabel && other.length === 0 && !(starQuality && quality)) return null;
  return (
    <div className={className}>
      {starQuality && quality ? (
        <>
          <p className="font-medium text-sand-light">{figureQualityText(quality)}</p>
          <p>{KANZUL_QUALITY_PROVENANCE_NOTE}</p>
          {figureQualityNotes(quality).map((note) => (
            <p key={note}>{note}</p>
          ))}
        </>
      ) : basisLabel ? (
        <p>
          <span className="text-sand/65">Basis: </span>
          <span className="font-medium text-sand-light">
            {basisLabel}
            {deciding.length > 0 ? ` — ${deciding.join(' · ')}` : ''}
          </span>
        </p>
      ) : null}
      {other.length > 0 ? <p>{basisLabel ? `Also: ${other.join(' · ')}` : other.join(' · ')}</p> : null}
    </div>
  );
}
