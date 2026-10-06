import { NextResponse } from 'next/server';
import { revokeCurrentSession } from '@/lib/server/emailSession';
import { isSameOriginRequest } from '@/lib/server/auth/requestGuards';
import { clearPendingChallengeCookie } from '@/lib/server/auth/pendingChallenge';

// Auth/session redesign: logout is a SERVER-SIDE revocation of this browser's
// session (a copied cookie stops working too), then the cookie is cleared.
// Only this browser is signed out — every other device stays signed in. The
// users row and everything attached to it (entitlements, payment requests,
// previews) are untouched.
//
// `Clear-Site-Data: "cache"` asks the browser to drop its HTTP cache for this
// origin, so a shared device keeps no cached copy of the signed-in pages.
// Deliberately NOT "storage": that would also wipe Past Readings and any
// downloaded books, which belong to the device, not the account.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
  }
  await revokeCurrentSession();
  // Shared device: also forget any half-finished code sign-in, so the next person
  // doesn't see the previous email on the code screen.
  clearPendingChallengeCookie();
  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'private, no-store', 'Clear-Site-Data': '"cache"' } },
  );
}
