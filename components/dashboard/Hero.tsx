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
export function Hero() {
  return (
    <div className="px-4">
      <div className="relative overflow-hidden rounded-3xl border border-sand/15 bg-gradient-to-br from-ink-card via-ink to-ink-light shadow-[0_0_50px_-20px_rgba(217,184,120,0.4)]">
        <PatternOverlay opacity={0.05} />
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(182,85,44,0.3), transparent 70%)' }}
        />
        <Emblem size={220} className="pointer-events-none absolute -right-10 -top-10 opacity-[0.07]" />
        <div className="relative px-5 pb-6 pt-6">
          <p className="type-label font-semibold uppercase tracking-[0.14em] text-clay-light">
            {HERO_VALUE_PROP.tags.join(' · ')}
          </p>
          <h1 className="mt-2 font-logo type-title leading-[1.15] text-sand-light">
            {HERO_VALUE_PROP.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-2.5 max-w-md type-meta leading-relaxed text-sand/65">{HERO_VALUE_PROP.body}</p>
          <Link
            href={HERO_VALUE_PROP.href}
            className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-gradient-to-b from-sand-light to-sand px-4 py-2.5 type-meta font-semibold text-ink shadow-[0_4px_14px_-4px_rgba(217,184,120,0.6)] transition-transform active:scale-95"
          >
            {HERO_VALUE_PROP.cta} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
