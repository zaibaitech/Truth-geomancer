import { Header } from '@/components/layout/Header';
import { CancellingMethodPractice } from '@/components/books/practice/CancellingMethodPractice';
import { BookAccessGate } from '@/components/books/BookAccessGate';
import { MASTER_CANCELLING_METHOD_FEATURE } from '@/lib/access/products';
import { canAccessForUser } from '@/lib/server/accessService';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';

// PROMPT 27: gated the same way as the Kanzul practice route — see that
// route's own comment for the offline-download implication (unaffected).
export default function CancellingMethodPracticePage() {
  const user = getCurrentUserIfPresent();
  const db = getDb();
  const authorized = user !== null && canAccessForUser(db, user.id, { kind: 'feature', featureKey: MASTER_CANCELLING_METHOD_FEATURE });

  if (!authorized) {
    return (
      <div>
        <Header title="Practice a method" />
        <BookAccessGate bookTitle="The Master of Geomancy" />
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
