'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, BookOpen, Users, Settings } from 'lucide-react';

const TABS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Requests', icon: Inbox },
  { href: '/admin/books', label: 'Books', icon: BookOpen },
  { href: '/admin/readers', label: 'Readers', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

// Prompt 65: a horizontal, scrollable tab strip — deliberately NOT the
// customer-facing BottomNav's shape (which stays mounted globally, see
// app/layout.tsx, and is untouched by this prompt) so an author navigating
// /admin/* never mistakes it for the customer app's own navigation (Phase 9's
// explicit "do not accidentally make /admin look like the customer Home
// page"). Scrolls horizontally rather than wrapping or shrinking to fit —
// 5 labeled tabs at a real touch-target size don't fit 360px, and shrinking
// them below readable/44px would violate the mobile requirements more than
// a swipe does.
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="scrollbar-none flex gap-1.5 overflow-x-auto border-b border-sand/10 px-4 py-2.5">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 type-label font-medium transition-colors ${
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
