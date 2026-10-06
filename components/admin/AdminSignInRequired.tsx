import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { signInHref } from '@/lib/auth/returnTo';

// Rendered for anyone without staff authority: no stats, requests, staff or
// book data — the calling page returns this BEFORE loading anything.
export function AdminSignInRequired() {
  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand/15 bg-ink-card text-clay-light">
          <ShieldCheck size={16} />
        </div>
        <div>
          <p className="font-logo text-lg text-sand-light">Truth Geomancer</p>
          <p className="type-label text-sand/65">Staff area</p>
        </div>
      </div>
      <Card>
        <p className="type-body font-semibold text-sand-light">Staff sign-in required</p>
        <p className="mt-1.5 type-body text-sand/70">
          This area is for Truth Geomancer authors and administrators. Sign in with your staff account to continue.
        </p>
        <Link
          href={signInHref('/admin')}
          className="mt-4 flex min-h-[48px] items-center justify-center rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
        >
          Sign in
        </Link>
      </Card>
      {/* Legacy break-glass access (shared secret) — kept during the
          transition until a platform admin account has been verified. */}
      <details className="mt-4 rounded-xl border border-sand/10 px-3.5 py-3">
        <summary className="cursor-pointer type-label text-sand/65">Emergency administrator access</summary>
        <AdminLoginForm />
      </details>
    </div>
  );
}
