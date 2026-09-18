import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Gift, Compass, Grid2x2 } from 'lucide-react';
import { EXPLORE_APP_ITEMS, type ExploreAppItem } from '@/lib/dashboard/exploreApp';
import { EXPLORE_APP_COPY } from '@/lib/dashboard/copy';

// Prompt 63: replaces the old "Quick Access" 2x2 horizontal-card layout
// with the approved concept's compact 4-across icon-over-label strip,
// leading with "Cast" (the app's core action) alongside the existing
// Master of Geomancy reader shortcuts. Routes/copy live in
// lib/dashboard/exploreApp.ts so they're testable independent of this JSX.
// "Cast" reuses Sparkles — the same icon BottomNav already uses for its
// own Cast tab — rather than inventing a second icon for the same action.
const ICONS: Record<ExploreAppItem['iconName'], typeof Sparkles> = {
  cast: Sparkles,
  stars: Star,
  sadaqah: Gift,
  buruj: Compass,
};

export function ExploreApp() {
  return (
    <div className="px-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Grid2x2 size={15} className="text-clay-light" />
          <h2 className="type-body font-semibold text-sand-light">{EXPLORE_APP_COPY.heading}</h2>
        </div>
        <Link href="/more" className="flex shrink-0 items-center gap-1 type-meta font-medium text-clay-light">
          See all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {EXPLORE_APP_ITEMS.map((item) => {
          const Icon = ICONS[item.iconName];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[44px] flex-col items-center gap-1.5 rounded-2xl border border-sand/12 bg-ink-card px-1.5 py-3 text-center transition-colors hover:border-sand/25 active:scale-[0.98]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/15 bg-ink text-clay-light">
                <Icon size={15} />
              </div>
              <p className="type-label font-medium leading-tight text-sand-light">{item.title}</p>
              <p className="type-label text-[10px] leading-tight text-sand/65">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
