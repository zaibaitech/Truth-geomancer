import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { Emblem } from '@/components/layout/Logo';
import { HERO_VALUE_PROP } from '@/lib/dashboard/copy';

// Prompt 63: replaces the old rotating 3-slide carousel with a single,
// compact hero card matching the approved visual concept — a plain Server
// Component (no interval/state needed once there's nothing to rotate),
// which also drops the client JS the carousel required. The "Open the
// Library"/"View My Star" destinations the old slides linked to remain
// fully reachable (bottom nav, and the Books section right below this),
// so nothing is actually removed — see app/page.tsx's own comment.
//
// Prompt 64: the Prompt 63 version was still sized like a desktop mockup
// composition squeezed into a phone — generous padding and a fixed 24px
// heading (.type-title, tuned for full-screen page titles elsewhere in the
// app) ate most of a 360px-tall first screen before "The Books" ever
// appeared. This version drops .type-title in favor of real responsive
// Tailwind text sizes (deliberately NOT wired to --reader-scale — that
// variable exists for long-form manuscript legibility preference, not this
// chrome-level card, and plain rem units already respect a reader's browser
// zoom on their own) so the heading can start smaller on a narrow phone and
// grow on wider screens, and tightens every padding/margin in the stack
// rather than shrinking anything below a readable floor. The decorative
// Emblem shrinks with viewport too (via className, which overrides its own
// width/height SVG attributes) — it's pointer-events-none and absolutely
// positioned, so this is a pure visual-weight change, never a layout-height
// one. Nothing in the copy, CTA destination, or message itself changed.
export function Hero() {
  return (
    <div className="px-4">
      <div className="relative overflow-hidden rounded-3xl border border-sand/15 bg-gradient-to-br from-ink-card via-ink to-ink-light shadow-[0_0_50px_-20px_rgba(217,184,120,0.4)]">
        <PatternOverlay opacity={0.05} />
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl sm:h-48 sm:w-48 lg:h-56 lg:w-56"
          style={{ background: 'radial-gradient(circle, rgba(182,85,44,0.3), transparent 70%)' }}
        />
        <Emblem
          size={160}
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 opacity-[0.07] sm:h-36 sm:w-36 lg:h-44 lg:w-44"
        />
        <div className="relative px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay-light sm:text-xs">
            {HERO_VALUE_PROP.tags.join(' · ')}
          </p>
          <h1 className="mt-1.5 font-logo text-xl leading-[1.15] text-sand-light sm:mt-2 sm:text-2xl lg:text-3xl">
            {HERO_VALUE_PROP.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-snug text-sand/65 sm:mt-2.5 sm:text-base sm:leading-relaxed">
            {HERO_VALUE_PROP.body}
          </p>
          <Link
            href={HERO_VALUE_PROP.href}
            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-gradient-to-b from-sand-light to-sand px-4 py-2.5 type-meta font-semibold text-ink shadow-[0_4px_14px_-4px_rgba(217,184,120,0.6)] transition-transform active:scale-95 sm:mt-4"
          >
            {HERO_VALUE_PROP.cta} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
