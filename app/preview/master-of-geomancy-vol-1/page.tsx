import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { MasterPreviewFlow } from '@/components/preview/MasterPreviewFlow';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getPreviewStatusForUser } from '@/lib/server/previewService';

// Prompt 29 — mirrors app/preview/kanzul-mikban/page.tsx's own structure.
// An entitled user is redirected to the REAL Counting Method practice page
// (already entitlement-gated, untouched by this prompt).
export default async function MasterPreviewPage() {
  const user = await getCurrentUserIfPresent();
  const db = user ? getDb() : null;
  const status = user && db ? await getPreviewStatusForUser(db, user.id, 'master-of-geomancy-vol-1') : 'available';

  if (status === 'entitled') {
    redirect('/books/master-of-geomancy-vol-1/practice/counting-method');
  }

  if (status === 'consumed') {
    return (
      <div>
        <Header title="Free Preview" />
        <div className="px-4 py-6">
          <Card className="text-center">
            <p className="type-body font-semibold text-sand-light">Free preview used</p>
            <p className="mt-1.5 type-body text-sand/70">
              You’ve already used your one free preview for The Master of Geomancy. Purchase access to unlock
              the full book.
            </p>
            <Link
              href="/purchase/master-of-geomancy-vol-1"
              className="mt-4 inline-block min-h-[44px] rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
            >
              Purchase access
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Free Preview" />
      <MasterPreviewFlow />
    </div>
  );
}
