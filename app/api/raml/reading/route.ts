import { NextResponse } from 'next/server';
import { getReadingResult } from '@/lib/server/raml/readingService';
import { isValidChart } from '@/lib/server/raml/chartValidation';
import { authorizeCastingForUser } from '@/lib/server/raml/castingAccess';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 59: Cast readings are entitlement-gated. authorizeCastingForUser
// runs BEFORE getReadingResult()/runReading(). Session is resolved server-
// side (never a body userId). Unauthorized responses contain no result.
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

  const result = getReadingResult(chart, authz.intentionId);
  if (!result) {
    return NextResponse.json({ error: 'Not covered by the engine.' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ result }, { headers: NO_STORE_HEADERS });
}
