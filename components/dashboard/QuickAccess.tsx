import Link from 'next/link';
import { Zap, Sparkles, Gift, Flame, Compass, ChevronRight } from 'lucide-react';

const BOOK = '/books/master-of-geomancy-vol-1/read';

const ITEMS = [
  {
    href: `${BOOK}/stars-and-symbols`,
    icon: Sparkles,
    title: 'The 16 Stars',
    description: 'Every name & symbol',
  },
  {
    href: `${BOOK}/star-sadaqah`,
    icon: Gift,
    title: 'Sadaqah Guide',
    description: 'Each star’s offering',
  },
  {
    href: `${BOOK}/elements-and-occupations`,
    icon: Flame,
    title: 'Elements & Work',
    description: 'Fire, Air, Water, Sand',
  },
  {
    href: `${BOOK}/knowing-your-buruji`,
    icon: Compass,
    title: 'Knowing Your Buruji',
    description: 'Find your life star',
  },
];

export function QuickAccess() {
  return (
    <div className="px-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Zap size={15} className="text-clay-light" />
        <h2 className="text-sm font-semibold text-sand-light">Quick Access</h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {ITEMS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-2.5 rounded-2xl border border-sand/12 bg-ink-card p-3 transition-colors hover:border-sand/25 active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/15 bg-ink text-clay-light">
              <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-tight text-sand-light">{title}</p>
              <p className="mt-0.5 truncate text-[11px] text-sand/45">{description}</p>
            </div>
            <ChevronRight size={14} className="mt-1 shrink-0 text-sand/25" />
          </Link>
        ))}
      </div>
    </div>
  );
}
