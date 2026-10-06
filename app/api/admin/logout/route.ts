import { NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/server/adminSession';
import { isSameOriginRequest } from '@/lib/server/auth/requestGuards';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 65: exposes the existing logoutAdmin() (present since Prompt 28
// but never wired to a route) so the Author Dashboard's Settings page can
// offer a real sign-out. Clearing a cookie needs no authorization check of
// its own — there is nothing sensitive to guard here, and an already-signed-
// out caller hitting this is a harmless no-op (cookies().delete() on a
// cookie that isn't set does nothing).
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 403, headers: NO_STORE_HEADERS });
  }
  // Deletes the server-side admin session row, then clears the cookie.
  await logoutAdmin();
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
