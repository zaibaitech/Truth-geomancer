import Link from 'next/link';
import { Search, Bell, Settings } from 'lucide-react';
import { Emblem } from '@/components/layout/Logo';
import { PatternOverlay } from '@/components/ui/PatternOverlay';

function IconButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/15 bg-ink-card/60 text-sand/70 transition-colors hover:border-sand/30 hover:text-sand-light active:scale-95"
    >
      {children}
    </Link>
  );
}

export function DashboardHeader() {
  return (
    <header className="relative overflow-hidden border-b border-sand/10 bg-gradient-to-b from-ink-light/60 to-ink px-4 pb-4 pt-5">
      <PatternOverlay opacity={0.045} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Emblem size={30} />
          <div className="min-w-0">
            <h1 className="truncate font-logo text-lg leading-tight text-sand-light">
              Truth Geomancer
            </h1>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-sand/65">
              Discover &middot; Learn &middot; Align
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <IconButton href="/search" label="Search">
            <Search size={15} />
          </IconButton>
          <IconButton href="/notifications" label="Notifications">
            <Bell size={15} />
          </IconButton>
          <IconButton href="/settings" label="Settings">
            <Settings size={15} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
