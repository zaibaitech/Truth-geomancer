'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, BookOpen, Star, MoreHorizontal } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/raml', label: 'Cast', icon: Sparkles },
  { href: '/books', label: 'Library', icon: BookOpen },
  { href: '/star', label: 'My Star', icon: Star },
  { href: '/more', label: 'More', icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-sand/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] ${
                active ? 'text-clay-light' : 'text-sand/50'
              }`}
            >
              {active ? (
                <span
                  className="absolute top-0 h-0.5 w-6 rounded-full bg-sand"
                  style={{ boxShadow: '0 0 8px 1px rgba(217,184,120,0.6)' }}
                />
              ) : null}
              <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
