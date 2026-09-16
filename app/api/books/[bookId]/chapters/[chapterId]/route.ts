// Protected content delivery route (Prompt 27, Phase 5).
//
// GET /api/books/:bookId/chapters/:chapterId
//
// This is the minimum server-controlled delivery mechanism the current
// Next.js App Router architecture needs: a Route Handler, executed
// server-only, that resolves the caller's session, checks entitlement via
// the existing canAccessForUser()/canAccess() (no duplicated rule), and
// returns real chapter content only when authorized. The book reader page
// itself (a Server Component) calls lib/server/contentService.ts
// directly and does not need this route — it exists for any
// client-side/programmatic caller that needs one chapter's content
// without a full page navigation.
//
// Security properties, each directly answering Phase 5's requirements:
//   - userId is never accepted from the client (query/body/header) — it
//     is resolved from the HTTP-only session cookie via getCurrentUser().
//   - entitlement status/product ownership is never accepted from the
//     client — it is loaded from the database inside canAccessForUser().
//   - unknown book/chapter -> 404, with a generic body (no hint about
//     what DOES exist).
//   - authenticated-but-unentitled -> 403, with a generic body (no
//     protected text, no hint about the chapter's content).
//   - Cache-Control: private, no-store on every response, since the
//     content (or lack of it) is specific to one session and must never
//     be cached by a shared/CDN cache.
import { NextResponse } from 'next/server';
import { getChapterForUser } from '@/lib/server/contentService';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

export async function GET(_request: Request, { params }: { params: { bookId: string; chapterId: string } }) {
  const user = await getCurrentUser();
  const db = getDb();
  const result = await getChapterForUser(db, user.id, params.bookId, params.chapterId);

  if (result.ok) {
    return NextResponse.json({ chapter: result.chapter }, { headers: NO_STORE_HEADERS });
  }

  if (result.reason === 'unauthorized') {
    return NextResponse.json(
      { error: 'This chapter requires an active entitlement for this book.' },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  // 'unknown-book' and 'unknown-chapter' are both reported the same way —
  // a generic 404 never reveals which of the two didn't exist, and never
  // enumerates what chapters/books DO exist.
  return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: NO_STORE_HEADERS });
}
