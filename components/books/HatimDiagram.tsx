'use client';

import { useId, useState } from 'react';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { arabicIndicToLatin, type HatimCell, type HatimDefinition } from '@/content/manuscripts/hatim';

type NumeralMode = 'original' | 'both' | 'latin';

const NUMERAL_MODE_LABEL: Record<NumeralMode, string> = {
  original: 'Original',
  both: 'Arabic + Latin',
  latin: 'Latin',
};

/** Renders one bordering cell's manuscript text according to the reader's
 * chosen numeral mode. The original glyph is never discarded — "Latin" mode
 * is a readability aid layered on top of the source, not a replacement for
 * it (section 7 of the restoration brief). */
function cellDisplayText(text: string, mode: NumeralMode): string {
  if (mode === 'original') return text;
  const latin = arabicIndicToLatin(text);
  if (mode === 'latin') return latin;
  return `${text} · ${latin}`;
}

/** Renders one bordering cell. A verified mark is shown as the manuscript
 * drew it — large, legible Arabic-Indic numerals, not shrunk to fit. An
 * unverified one says so in words rather than leaving the cell blank or
 * guessing at a digit; screen-reader text carries the same distinction (see
 * the visually-hidden list below the grid) so the honesty survives past the
 * visual styling. */
function BorderCell({
  cell,
  position,
  numeralMode,
}: {
  cell: HatimCell;
  position: string;
  numeralMode: NumeralMode;
}) {
  return (
    <div
      className={`flex items-center justify-center border-sand/25 p-2 text-center ${position}`}
      aria-hidden
    >
      {cell.status === 'verified' ? (
        <span className="type-method text-clay-light" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
          {cellDisplayText(cell.text, numeralMode)}
        </span>
      ) : (
        <span className="type-label italic text-sand/65">under review</span>
      )}
    </div>
  );
}

const CELL_LABEL: Record<keyof HatimDefinition['border'], string> = {
  topLeft: 'top-left',
  topMiddle: 'top-middle',
  topRight: 'top-right',
  middleLeft: 'middle-left',
  middleRight: 'middle-right',
  bottomLeft: 'bottom-left',
  bottomMiddle: 'bottom-middle',
  bottomRight: 'bottom-right',
};

/** A deterministic, source-faithful reproduction of one star's Hatim
 * diagram: a 3x3 grid, drawn with CSS borders (crisp at any zoom, unlike a
 * scanned image) rather than freehand SVG paths — the geometry is simple
 * enough that a grid is the more honest representation of "ruled lines on
 * paper" than a hand-traced curve would be.
 *
 * The centre cell's figure is the star's own four-line pattern — verified
 * against the source for several stars and treated as a general rule; see
 * content/manuscripts/hatim.ts. Every bordering cell is either the exact
 * mark the manuscript draws there, or an explicit "under review" — this
 * component never fills a gap with a plausible-looking placeholder. */
export function HatimDiagram({ hatim, starName }: { hatim: HatimDefinition; starName: string }) {
  const { border } = hatim;
  const cells = Object.entries(border) as [keyof HatimDefinition['border'], HatimCell][];
  const reviewCount = cells.filter(([, c]) => c.status === 'review').length;
  const [numeralMode, setNumeralMode] = useState<NumeralMode>('original');
  const groupId = useId();

  return (
    <div>
      <div role="radiogroup" aria-label={`Numeral display for the ${starName} Hatim`} className="mb-2 flex gap-1">
        {(Object.keys(NUMERAL_MODE_LABEL) as NumeralMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={numeralMode === mode}
            id={`${groupId}-${mode}`}
            onClick={() => setNumeralMode(mode)}
            className={`type-label rounded-full border px-2.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay-light ${
              numeralMode === mode ? 'border-clay-light bg-clay-light/15 text-clay-light' : 'border-sand/25 text-sand/65'
            }`}
          >
            {NUMERAL_MODE_LABEL[mode]}
          </button>
        ))}
      </div>

      <div
        role="img"
        aria-label={`Hatim diagram for ${starName} from The Master of Geomancy${
          reviewCount > 0 ? `. ${reviewCount} of 8 bordering marks are unverified and shown as under review.` : '.'
        }`}
        className="grid overflow-hidden rounded-lg border border-sand/25"
        style={{ gridTemplateColumns: '1fr 1.6fr 1fr', gridTemplateRows: '1fr 1.8fr 1fr' }}
      >
        <BorderCell cell={border.topLeft} position="border-b border-r" numeralMode={numeralMode} />
        <BorderCell cell={border.topMiddle} position="border-b border-r" numeralMode={numeralMode} />
        <BorderCell cell={border.topRight} position="border-b" numeralMode={numeralMode} />

        <BorderCell cell={border.middleLeft} position="border-r" numeralMode={numeralMode} />
        <div className="flex flex-col items-center justify-center gap-2 border-r border-sand/25 p-3">
          <FigureGlyph pattern={hatim.centerFigure} size="sm" />
          <span className="italic text-sand-light" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
            {hatim.centerLabel}
          </span>
        </div>
        <BorderCell cell={border.middleRight} position="" numeralMode={numeralMode} />

        <BorderCell cell={border.bottomLeft} position="border-t border-r" numeralMode={numeralMode} />
        <BorderCell cell={border.bottomMiddle} position="border-t border-r" numeralMode={numeralMode} />
        <BorderCell cell={border.bottomRight} position="border-t" numeralMode={numeralMode} />
      </div>

      {/* The role="img" label above summarises the diagram for a screen
       * reader; this list gives the same reader every individual cell's
       * content on request — always with both the original glyph and its
       * Latin equivalent, regardless of the visual toggle above — so
       * nothing meaningful is locked inside the visual-only grid (section
       * 18 of the restoration brief). */}
      <ul className="sr-only">
        {cells.map(([key, cell]) => (
          <li key={key}>
            {CELL_LABEL[key]}:{' '}
            {cell.status === 'verified' ? `${cell.text} (${arabicIndicToLatin(cell.text)})` : `unverified — ${cell.note}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
