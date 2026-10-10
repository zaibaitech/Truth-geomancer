import { NextResponse } from 'next/server';
import { isValidChart } from '@/lib/server/raml/chartValidation';
import { authorizeCastingForUser } from '@/lib/server/raml/castingAccess';
import { buildChartNotes } from '@/lib/server/raml/chartNotes';
import { GENERAL_READING_INTENTION_ID } from '@/lib/access/castingAuthorization';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// The paid per-chart star notes (house-6 / house-2 meanings and the sadaqah offering) are part of the
// General Reading, which is owned by The Master of Geomancy (lib/access/methodOwnership.ts). The decision
// is the existing authorizeCastingForUser() for that reading, resolved from the server-side session
// (never a body userId) and made BEFORE anything is read from the protected store. A visitor without the
// entitlement gets a 403 with no notes. Remedies are never returned.
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
  const { chart } = body as Record<string, unknown>;
  if (!isValidChart(chart)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const user = await getCurrentUser();
  const authz = await authorizeCastingForUser(getDb(), user.id, GENERAL_READING_INTENTION_ID);
  if (!authz.allowed) {
    return NextResponse.json(
      { error: 'These notes require an active entitlement.', accessState: authz.accessState, bookId: authz.bookId },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json({ notes: buildChartNotes(chart) }, { headers: NO_STORE_HEADERS });
}
