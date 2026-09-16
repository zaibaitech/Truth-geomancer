import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { consumeLoginToken } from '@/lib/server/emailAuth';
import { setAuthenticatedSessionCookie } from '@/lib/server/emailSession';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// GET, not POST: a magic link delivered by email can only ever be opened
// as a plain navigation (a click), which every email client sends as GET
// — there is no way to make an inbox issue a POST. The state-changing
// work (atomically consuming the token) still happens entirely
// server-side inside consumeLoginToken()'s real transaction; this route
// never reads a body or trusts anything except the token itself.
//
// Deliberately never calls getCurrentUser() (Prompt 46 §10's explicit
// rule) — only consumeLoginToken(), which resolves the authenticated
// identity purely from the token. The device's existing cookie, if any,
// is never consulted here.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const redirectTo = new URL('/settings', url.origin);

  if (!token) {
    redirectTo.searchParams.set('auth_error', 'missing-token');
    return NextResponse.redirect(redirectTo, { headers: NO_STORE_HEADERS });
  }

  const db = getDb();
  const result = await consumeLoginToken(db, token);

  if (!result.ok) {
    redirectTo.searchParams.set('auth_error', result.reason);
    return NextResponse.redirect(redirectTo, { headers: NO_STORE_HEADERS });
  }

  setAuthenticatedSessionCookie(result.sessionToken);
  redirectTo.searchParams.set('verified', '1');
  return NextResponse.redirect(redirectTo, { headers: NO_STORE_HEADERS });
}
