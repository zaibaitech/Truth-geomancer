// Protected whole-book download endpoint (Prompt 30, Phase 5).
//
// GET /api/books/:bookId/offline
//
// The one server-controlled path an explicit "Download for offline" action
// goes through. Mirrors app/api/books/[bookId]/chapters/[chapterId]/route.ts
// (Prompt 27) exactly in its security shape — same identity resolution, same
// access decision, same generic error responses — just returning the whole
// authorized book instead of one chapter, via the new
// getBookContentForUser() in contentService.ts (no duplicated access rule,
// no duplicated content source).
//
// Security properties:
//   - userId is never accepted from the client — resolved from the
//     HTTP-only session cookie via getCurrentUser().
//   - entitlement is never accepted from the client — canAccessForUser()
//     inside getBookContentForUser() is the only source of truth.
//   - bookId comes only from the URL path segment, never a query param a
//     client could swap to request a different book than the one shown.
//   - unknown book -> 404 (generic body). Authenticated-but-unentitled ->
//     403 (generic body, no chapter titles, no hint of content).
//   - Cache-Control: private, no-store — this response is specific to one
//     session and must never be cached by a shared/CDN cache. (The
//     client's own explicit Cache Storage write, in lib/offline/
//     bookCache.ts, is a deliberate, separate, user-initiated action, not
//     an HTTP-cache-layer concern this header governs.)
import { NextResponse } from 'next/server';
import { getBookContentForUser } from '@/lib/server/contentService';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

export async function GET(_request: Request, { params }: { params: { bookId: string } }) {
  const user = await getCurrentUser();
  const db = getDb();
  const result = await getBookContentForUser(db, user.id, params.bookId);

  if (result.ok) {
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  }

  if (result.reason === 'unauthorized') {
    return NextResponse.json(
      { error: 'This book requires an active entitlement for offline download.' },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: NO_STORE_HEADERS });
}
