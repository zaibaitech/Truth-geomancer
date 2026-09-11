import Link from 'next/link';
import { FigureGlyph } from '@/components/raml/FigureGlyph';

export function HeroCard() {
  return (
    <div className="mx-4 overflow-hidden rounded-2xl border border-sand/10 bg-gradient-to-br from-ink-card to-ink px-5 py-6">
      <p className="text-[11px] uppercase tracking-widest text-sand/45">Ilm al-Raml</p>
      <h2 className="mt-1 font-logo text-2xl leading-snug text-sand-light">
        Cast the sand.
        <br />
        Read the figures.
      </h2>
      <p className="mt-2 max-w-[220px] text-sm text-sand/60">
        Sixteen stars, one chart, an answer drawn the way it has always been drawn.
      </p>
      <Link
        href="/raml"
        className="mt-4 inline-block rounded-xl bg-clay px-4 py-2.5 text-sm font-semibold text-ink"
      >
        Begin a casting
      </Link>
      <div className="mt-5 flex justify-end gap-3 opacity-70">
        <FigureGlyph pattern={[1, 2, 1, 2]} size="sm" />
        <FigureGlyph pattern={[2, 1, 2, 1]} size="sm" />
        <FigureGlyph pattern={[1, 1, 2, 2]} size="sm" />
      </div>
    </div>
  );
}
