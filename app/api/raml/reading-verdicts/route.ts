import { NextResponse } from 'next/server';
import { getReadingVerdictsForIntention } from '@/lib/server/readingVerdictService';
import { isValidChart } from '@/lib/server/raml/chartValidation';
import { authorizeCastingForUser } from '@/lib/server/raml/castingAccess';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 59: the fallback "Your Reading" path is gated the same way as
// /api/raml/reading. Chapter IDs are still never taken from the client
// (see readingVerdictService.ts). Authorization runs BEFORE any verdict
// computation.
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
  const { intentionId, chart } = body as Record<string, unknown>;

  if (typeof intentionId !== 'string' || !isValidChart(chart)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const user = await getCurrentUser();
  const authz = await authorizeCastingForUser(getDb(), user.id, intentionId);
  if (authz.reason === 'unknown-intention') {
    return NextResponse.json({ error: 'Unknown question.' }, { status: 404, headers: NO_STORE_HEADERS });
  }
  if (!authz.allowed) {
    return NextResponse.json(
      { error: 'This reading requires an active entitlement.', accessState: authz.accessState, bookId: authz.bookId },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const result = getReadingVerdictsForIntention(authz.intentionId, chart);
  if (!result.ok) {
    return NextResponse.json({ error: 'Unknown question.' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ verdicts: result.verdicts }, { headers: NO_STORE_HEADERS });
}
