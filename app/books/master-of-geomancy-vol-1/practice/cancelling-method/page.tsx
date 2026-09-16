import { Header } from '@/components/layout/Header';
import { CancellingMethodPractice } from '@/components/books/practice/CancellingMethodPractice';
import { BookAccessGate } from '@/components/books/BookAccessGate';
import { MASTER_CANCELLING_METHOD_FEATURE, MASTER_PRODUCT } from '@/lib/access/products';
import { canAccessForUser } from '@/lib/server/accessService';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getProductAccessStatus } from '@/lib/server/purchaseStatus';
import { getPreviewStatusForUser } from '@/lib/server/previewService';

// PROMPT 27: gated the same way as the Kanzul practice route — see that
// route's own comment for the offline-download implication (unaffected).
export default async function CancellingMethodPracticePage() {
  const user = await getCurrentUserIfPresent();
  const db = getDb();
  const authorized =
    user !== null && (await canAccessForUser(db, user.id, { kind: 'feature', featureKey: MASTER_CANCELLING_METHOD_FEATURE }));

  if (!authorized) {
    const status = user !== null ? await getProductAccessStatus(db, user.id, MASTER_PRODUCT.id) : 'none';
    const previewStatus = user !== null ? await getPreviewStatusForUser(db, user.id, MASTER_PRODUCT.id) : 'available';
    return (
      <div>
        <Header title="Practice a method" />
        <BookAccessGate bookTitle="The Master of Geomancy" productId={MASTER_PRODUCT.id} status={status} previewStatus={previewStatus} />
      </div>
    );
  }

  return (
    <div>
      <Header title="Practice a method" />
      <CancellingMethodPractice />
    </div>
  );
}
