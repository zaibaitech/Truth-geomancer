import { NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/server/adminSession';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// The ONLY place TG_ADMIN_SECRET is ever compared against a request body —
// never logged, never echoed back, never exposed to client code (it is a
// plain server-only env var, not a NEXT_PUBLIC_ one). A wrong or missing
// secret gets an identical 401 either way (see adminAuth.ts's own comment
// on verifyAdminSecret's fail-closed behavior).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const { secret } = body as Record<string, unknown>;
  if (typeof secret !== 'string' || secret.length === 0) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const ok = await loginAdmin(secret);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid administrator secret.' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
