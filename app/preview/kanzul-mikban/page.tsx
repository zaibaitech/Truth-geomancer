import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { KanzulPreviewFlow } from '@/components/preview/KanzulPreviewFlow';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getPreviewStatusForUser } from '@/lib/server/previewService';

// Prompt 29 — dedicated preview entry point, separate from the real
// (entitlement-gated) practice route at
// app/raml/practice/[chapterId]/[methodId]/page.tsx, which is untouched.
// An entitled user gets redirected to the REAL practice page (Phase 11:
// "do not show a misleading preview CTA to an entitled user") rather than
// this preview screen.
export default async function KanzulPreviewPage() {
  const user = await getCurrentUserIfPresent();
  const db = user ? getDb() : null;
  const status = user && db ? await getPreviewStatusForUser(db, user.id, 'kanzul-mikban') : 'available';

  if (status === 'entitled') {
    redirect('/raml/practice/if-you-will-own-a-house-in-your/own-house-in-life-method-1');
  }

  if (status === 'consumed') {
    return (
      <div>
        <Header title="Free Preview" />
        <div className="px-4 py-6">
          <Card className="text-center">
            <p className="type-body font-semibold text-sand-light">Free preview used</p>
            <p className="mt-1.5 type-body text-sand/70">
              You’ve already used your one free preview for Kanzul Mikban. Purchase access to unlock all 153
              methods.
            </p>
            <Link
              href="/purchase/kanzul-mikban"
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
      <KanzulPreviewFlow />
    </div>
  );
}
