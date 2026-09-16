import { Header } from '@/components/layout/Header';
import { CountingMethodPractice } from '@/components/books/practice/CountingMethodPractice';
import { BookAccessGate } from '@/components/books/BookAccessGate';
import { MASTER_COUNTING_METHOD_FEATURE, MASTER_PRODUCT } from '@/lib/access/products';
import { canAccessForUser } from '@/lib/server/accessService';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getProductAccessStatus } from '@/lib/server/purchaseStatus';

// PROMPT 27: gated the same way as the Kanzul practice route — see that
// route's own comment for the offline-download implication (unaffected).
export default function CountingMethodPracticePage() {
  const user = getCurrentUserIfPresent();
  const db = getDb();
  const authorized = user !== null && canAccessForUser(db, user.id, { kind: 'feature', featureKey: MASTER_COUNTING_METHOD_FEATURE });

  if (!authorized) {
    const status = user !== null ? getProductAccessStatus(db, user.id, MASTER_PRODUCT.id) : 'none';
    return (
      <div>
        <Header title="Practice a method" />
        <BookAccessGate bookTitle="The Master of Geomancy" productId={MASTER_PRODUCT.id} status={status} />
      </div>
    );
  }

  return (
    <div>
      <Header title="Practice a method" />
      <CountingMethodPractice />
    </div>
  );
}
