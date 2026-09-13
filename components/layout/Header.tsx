import { Settings } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './Logo';

export function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <header className="border-b border-sand/10 px-4 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <Logo />
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-sand/15 text-sand/70"
        >
          <Settings size={16} />
        </Link>
      </div>
      {title ? (
        <div className="mt-3">
          <h1 className="font-logo text-xl text-sand-light">{title}</h1>
          {subtitle ? <p className="mt-0.5 type-label text-sand/65">{subtitle}</p> : null}
        </div>
      ) : null}
    </header>
  );
}
