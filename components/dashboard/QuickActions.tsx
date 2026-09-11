import Link from 'next/link';
import { Sparkles, BookOpen, Star } from 'lucide-react';

const actions = [
  { href: '/raml', label: 'Cast a Chart', icon: Sparkles },
  { href: '/books', label: 'Library', icon: BookOpen },
  { href: '/star', label: 'My Star', icon: Star },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-2 px-4">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-sand/10 bg-ink-card px-2 py-3 text-center"
        >
          <Icon size={18} className="text-clay-light" />
          <span className="text-[11px] text-sand/70">{label}</span>
        </Link>
      ))}
    </div>
  );
}
