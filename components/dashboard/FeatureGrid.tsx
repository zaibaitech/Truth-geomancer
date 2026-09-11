import Link from 'next/link';
import { Sparkles, BookOpen, Star, GraduationCap, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    href: '/raml',
    icon: Sparkles,
    title: 'Cast a Chart',
    description: 'Create your chart and get your reading',
  },
  {
    href: '/books',
    icon: BookOpen,
    title: 'Library',
    description: 'Explore books & knowledge',
  },
  {
    href: '/star',
    icon: Star,
    title: 'My Star',
    description: 'Your saved charts and readings',
  },
  {
    href: '/books/master-of-geomancy-vol-1/read/drawing-a-chart',
    icon: GraduationCap,
    title: 'Learn Geomancy',
    description: 'Start from the first chapter',
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {FEATURES.map(({ href, icon: Icon, title, description }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col justify-between rounded-2xl border border-sand/12 bg-ink-card px-4 py-4 transition-colors hover:border-sand/25 active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 bg-ink text-clay-light">
            <Icon size={18} />
          </div>
          <div className="mt-3">
            <p className="text-[15px] font-semibold text-sand-light">{title}</p>
            <p className="mt-0.5 text-xs leading-snug text-sand/50">{description}</p>
          </div>
          <ArrowRight
            size={14}
            className="mt-3 text-sand/30 transition-transform group-hover:translate-x-0.5 group-hover:text-clay-light"
          />
        </Link>
      ))}
    </div>
  );
}
