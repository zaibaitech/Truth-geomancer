'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, BookOpen, Users, UserCog } from 'lucide-react';

// Navigation only — every page and API enforces its own authorization
// server-side (see adminActor on the server). Hiding a tab grants nothing.
const PLATFORM_TABS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Requests', icon: Inbox },
  { href: '/admin/books', label: 'Books', icon: BookOpen },
  { href: '/admin/readers', label: 'Readers', icon: Users },
  { href: '/admin/staff', label: 'Staff', icon: UserCog },
] as const;

const AUTHOR_TABS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/books', label: 'My Books', icon: BookOpen },
] as const;

export type AdminNavVariant = 'platform' | 'author';

// Mobile: a 2-column grid of full-width, 44px-tall tabs, so every section is
// visible without horizontal scrolling and nothing shrinks below a readable
// size. From `sm` up the same tabs sit in one wrapping row. Deliberately not
// the customer BottomNav's shape (that stays mounted globally, untouched).
export function AdminNav({ variant }: { variant: AdminNavVariant }) {
  const pathname = usePathname();
  const TABS = variant === 'author' ? AUTHOR_TABS : PLATFORM_TABS;

  return (
    <nav aria-label="Admin sections" className="grid grid-cols-2 gap-2 border-b border-sand/10 px-4 py-2.5 sm:flex sm:flex-wrap sm:gap-1.5">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border px-3.5 type-label font-medium transition-colors sm:shrink-0 sm:justify-start ${
              active ? 'border-clay/40 bg-clay/15 text-clay-light' : 'border-sand/12 text-sand/65'
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
