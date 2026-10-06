import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { clearPendingChallengeCookie, getCurrentChallengeView } from '@/lib/server/auth/pendingChallenge';
import { isSameOriginRequest } from '@/lib/server/auth/requestGuards';

// Resumable sign-in code screen. GET reports whether THIS browser has a pending
// (or just-expired) code, so a refresh or a return from the email app can show
// the code screen again. DELETE is the explicit "Use a different email" cancel.
// GET only reads — it never sends an email, never creates a code, and never
// returns the code or the challenge id. See lib/server/auth/pendingChallenge.ts.
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const view = await getCurrentChallengeView(getDb());
  return NextResponse.json(view ? { pending: true, ...view } : { pending: false }, { headers: NO_STORE_HEADERS });
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403, headers: NO_STORE_HEADERS });
  }
  clearPendingChallengeCookie();
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
