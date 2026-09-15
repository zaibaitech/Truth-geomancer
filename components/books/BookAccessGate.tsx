import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * The "you don't have access to this yet" screen for a protected book or
 * method (Prompt 27, Phase 10 — "UI should show an appropriate access
 * state"). Deliberately plain and consistent with the rest of the app's
 * card/button language, not a new visual system: this is a state a reader
 * hits, not a marketing page.
 *
 * No protected content is ever passed into or rendered by this component
 * — it is the alternative to rendering protected content, not a wrapper
 * around it.
 */
export function BookAccessGate({ bookTitle }: { bookTitle: string }) {
  return (
    <div className="px-4 py-6">
      <Card className="text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 text-clay-light">
          <Lock size={16} aria-hidden />
        </div>
        <p className="mt-3 type-body font-semibold text-sand-light">This book isn’t in your library yet</p>
        <p className="mt-1.5 type-body text-sand/70">
          {bookTitle} requires an active entitlement to read. Manual purchase approval isn’t live
          yet — check back soon.
        </p>
        <Link
          href="/books"
          className="mt-4 inline-block min-h-[44px] rounded-xl border border-sand/15 px-4 py-2.5 type-body text-sand-light"
        >
          Back to Library
        </Link>
      </Card>
    </div>
  );
}
