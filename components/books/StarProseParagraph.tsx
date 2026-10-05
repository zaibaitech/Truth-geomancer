import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { STARS } from '@/content/stars';
import { splitFigureText, type FigureTextSegment } from '@/lib/raml/kanzulStarText';
import { SOURCE_INCOMPLETE_NOTICE, cleanSourceText } from '@/lib/raml/customerText';

/** One Kanzul Mikban paragraph, rendered like `ProseParagraph` (same markup,
 * same classes, same **bold** handling) except that
 *  - every canonical star name is followed by that star's own four-row figure,
 *    taken from STARS, and
 *  - ⟦star-id⟧ markup (a figure the edition prints without that star's name
 *    beside it) is drawn as the bare figure.
 * The text itself is never rewritten: removing the figures leaves exactly the
 * original paragraph. `figures={false}` draws neither. */
const CHIP =
  'mx-0.5 my-1 inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-sand/10 bg-ink px-2 py-1 align-middle text-sand-light';

// A <div>, not a <span>: FigureGlyph renders block elements, and block
// elements inside a <p> make the browser split the paragraph (invalid HTML).
export function StarChip({ starId, name, wrap = false }: { starId: string; name: string; wrap?: boolean }) {
  const star = STARS.find((s) => s.id === starId)!;
  return (
    <div data-star-figure={star.id} className={wrap ? CHIP.replace('whitespace-nowrap', 'whitespace-normal') : CHIP}>
      <span>{name}</span>
      <FigureGlyph pattern={star.pattern} size="sm" />
    </div>
  );
}

function BareFigure({ starId }: { starId: string }) {
  const star = STARS.find((s) => s.id === starId)!;
  return (
    <div data-bare-figure={star.id} className={CHIP}>
      <FigureGlyph pattern={star.pattern} size="sm" />
    </div>
  );
}

/** Segments -> nodes. Punctuation straight after a figure ("Yunus," / "Ayuba.")
 * is kept in the same unbreakable group as it, so a comma never starts a line
 * on its own. */
function renderSegments(input: FigureTextSegment[]) {
  const segments = input.slice();
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.kind === 'text') {
      nodes.push(<span key={i}>{seg.text}</span>);
      continue;
    }
    const next = segments[i + 1];
    const punct = next && next.kind === 'text' ? /^[,.;:)]+/.exec(next.text)?.[0] ?? '' : '';
    nodes.push(
      <div key={i} className="inline whitespace-nowrap">
        {seg.kind === 'star' ? <StarChip starId={seg.starId} name={seg.text} /> : <BareFigure starId={seg.starId} />}
        {punct}
      </div>,
    );
    if (punct && next && next.kind === 'text') segments[i + 1] = { kind: 'text', text: next.text.slice(punct.length) };
  }
  return nodes;
}

export function StarProseParagraph({
  text: rawText,
  figures = true,
  plainNames,
  noticeWhenIncomplete = true,
}: {
  text: string;
  figures?: boolean;
  /** Canonical names that stay plain words in this paragraph (see KANZUL_PLAIN_STAR_NAMES). */
  plainNames?: ReadonlySet<string>;
  /** When an internal transcription marker was removed from this paragraph,
   * follow it with the neutral source-limitation line. */
  noticeWhenIncomplete?: boolean;
}) {
  const { text, removedMarker } = cleanSourceText(rawText);
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const hasFigures = splitFigureText(text).some((seg) => seg.kind === 'glyph' || (seg.kind === 'star' && !plainNames?.has(seg.text)));
  const showFigures = figures || /⟦[a-z-]+⟧/.test(text); // bare figures are the edition's own drawing, always shown
  const body = parts.map((part, i) => {
    const bold = part.startsWith('**') && part.endsWith('**');
    const inner = bold ? part.slice(2, -2) : part;
    // With figures off, canonical names stay plain text (chapter 121); only the edition's own bare figures are drawn.
    const segs = splitFigureText(inner).map((s) => (s.kind === 'star' && (!figures || plainNames?.has(s.text)) ? { kind: 'text' as const, text: s.text } : s));
    const content = showFigures ? renderSegments(segs) : inner;
    return bold ? (
      <strong key={i} className="text-sand-light">
        {content}
      </strong>
    ) : (
      <span key={i}>{content}</span>
    );
  });
  const base = 'manuscript-paragraph mb-5 break-words type-body leading-[1.7] text-sand/80 hyphens-auto last:mb-0';
  // Justified text stretches the gaps around figure chips, so paragraphs that
  // carry figures are left-aligned; all others keep the manuscript's justification.
  const withFigures = hasFigures && showFigures;
  const className = withFigures ? `${base} text-left` : `${base} text-justify`;
  const paragraph = withFigures ? (
    <div role="paragraph" className={className}>
      {body}
    </div>
  ) : (
    <p className={className}>{body}</p>
  );
  if (!(removedMarker && noticeWhenIncomplete)) return paragraph;
  return (
    <>
      {paragraph}
      <p className="-mt-3 mb-5 type-evidence italic text-sand/65">{SOURCE_INCOMPLETE_NOTICE}</p>
    </>
  );
}
