import { Settings } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './Logo';
import { AccountButton } from '@/components/auth/AccountButton';
import type { AuthStatus } from '@/components/auth/useAuthStatus';

export function Header({
  title,
  subtitle,
  initialAuth = null,
}: {
  title?: string;
  subtitle?: string;
  /** Optional server-resolved sign-in state for the account button. */
  initialAuth?: AuthStatus | null;
}) {
  return (
    <header className="border-b border-sand/10 px-4 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <Logo />
        <div className="flex shrink-0 items-center gap-1.5">
          <AccountButton initialStatus={initialAuth} />
          <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-sand/15 text-sand/70"
        >
          <Settings size={16} />
          </Link>
        </div>
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
