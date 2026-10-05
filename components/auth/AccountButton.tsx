'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { signInHref } from '@/lib/auth/returnTo';
import { useAuthStatus } from './useAuthStatus';

/**
 * The always-visible account entry in the app header (auth/session
 * redesign): "Sign in" when signed out — returning the person to the page
 * they were on — or an account icon when signed in. Until the status is
 * known it renders an invisible placeholder of the same size, so it never
 * flashes "Sign in" at someone who is already signed in.
 */
export function AccountButton() {
  const status = useAuthStatus();
  const pathname = usePathname() ?? '/';

  // Already on the sign-in screens: a second "Sign in" would only loop back.
  if (pathname === '/signin' || pathname.startsWith('/auth/')) return null;
  if (status === null) {
    return <span aria-hidden className="inline-block h-8 w-[68px] shrink-0" />;
  }
  if (status.authenticated) {
    return (
      <Link
        href="/settings"
        aria-label={`Account — signed in${status.email ? ` as ${status.email}` : ''}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-clay/40 bg-clay/10 text-clay-light"
      >
        <UserRound size={15} aria-hidden />
      </Link>
    );
  }
  return (
    <Link
      href={signInHref(pathname)}
      className="flex h-8 shrink-0 items-center rounded-full border border-clay/40 px-3 type-label font-semibold text-clay-light"
    >
      Sign in
    </Link>
  );
}
