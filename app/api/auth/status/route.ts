import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/emailSession';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Read-only status check for the client-side account UI
// (components/auth/AccountSection.tsx). Returns only {authenticated,
// email} — never a userId, a token, or any entitlement/database detail
// (Prompt 46 §18/§19's explicit UI-exposure requirement).
export async function GET() {
  const status = await getAuthenticatedUser();
  return NextResponse.json(status, { headers: NO_STORE_HEADERS });
}
