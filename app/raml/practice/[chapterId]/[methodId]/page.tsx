import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { MethodPracticeFlow } from '@/components/raml/practice/MethodPracticeFlow';
import { BookAccessGate } from '@/components/books/BookAccessGate';
import { findPracticableMethod } from '@/lib/raml/methodPractice';
import { canAccessForUser } from '@/lib/server/accessService';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';

// PROMPT 27 (protected-content migration): this route is no longer
// statically generated. It used to be (Prompt 23) because nothing it
// rendered depended on the requester — that stopped being true the moment
// method access became entitlement-gated: the correct response now
// genuinely differs per session (practice flow vs. BookAccessGate), which
// a build-time static page cannot represent. See
// lib/offline/bookOfflineUrls.ts's own comment for what this means for
// the existing offline-download feature (unaffected — an unentitled
// download attempt now gets a 401/403-equivalent unauthorized render,
// which the existing cache-on-success-only logic in lib/offline/
// bookCache.ts already refuses to cache, with no change needed there).

export default function MethodPracticePage({
  params,
}: {
  params: { chapterId: string; methodId: string };
}) {
  const practicable = findPracticableMethod(params.chapterId, params.methodId);
  if (!practicable) notFound();

  const user = getCurrentUserIfPresent();
  const db = getDb();
  const authorized =
    user !== null &&
    canAccessForUser(db, user.id, {
      kind: 'method',
      bookId: 'kanzul-mikban',
      methodId: params.methodId,
    });

  if (!authorized) {
    return (
      <div>
        <Header title="Practice a method" />
        <BookAccessGate bookTitle="Kanzul Mikban" />
      </div>
    );
  }

  return (
    <div>
      <Header title="Practice a method" />
      <MethodPracticeFlow chapterId={params.chapterId} methodId={params.methodId} />
    </div>
  );
}
