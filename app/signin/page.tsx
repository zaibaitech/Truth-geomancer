import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { SignInFlow } from '@/components/auth/SignInFlow';
import { safeReturnTo } from '@/lib/auth/returnTo';

// Auth/session redesign, Phase 3: the dedicated sign-in page, reachable from
// the header on every screen, from access gates and purchase pages, and from
// Settings. `returnTo` is validated server-side (same-origin path only) so it
// can never become an open redirect.
export const metadata: Metadata = { title: 'Sign in — Truth Geomancer', referrer: 'no-referrer' };
export const dynamic = 'force-dynamic';

export default function SignInPage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const returnTo = safeReturnTo(searchParams?.returnTo ?? null);
  return (
    <div>
      <Header title="Sign in" subtitle="Keep your books and readings with you on any device" />
      <div className="px-4 py-5">
        <SignInFlow returnTo={returnTo} />
      </div>
    </div>
  );
}
