'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signInHref } from '@/lib/auth/returnTo';
import { useAuthStatus } from './useAuthStatus';

/**
 * Inline "Already bought it? Sign in" for the places sign-in is naturally
 * needed — book access gates and purchase pages (auth/session redesign).
 * Returns the person to this exact page afterwards. Shows nothing while the
 * status is loading, and a quiet "Signed in as …" line once signed in.
 */
export function SignInPrompt({ message = 'Already have access on another device?' }: { message?: string }) {
  const status = useAuthStatus();
  const pathname = usePathname() ?? '/';
  if (status === null) return null;
  if (status.authenticated) {
    return <p className="mt-4 text-center type-meta text-sand/65">Signed in as {status.email}</p>;
  }
  return (
    <p className="mt-4 text-center type-body text-sand/70">
      {message}{' '}
      <Link href={signInHref(pathname)} className="font-semibold text-clay-light underline underline-offset-2">
        Sign in
      </Link>
    </p>
  );
}
