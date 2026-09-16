import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/server/emailSession';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Clears the session cookie only. Never deletes the users row, never
// touches entitlements/payment_requests/preview_usage (Prompt 46 §21's
// explicit requirement) — the account and everything attached to its
// users.id remain exactly as they were.
export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
