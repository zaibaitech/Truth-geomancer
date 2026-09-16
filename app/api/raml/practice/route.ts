import { NextResponse } from 'next/server';
import { getPracticeMethodForUser } from '@/lib/server/raml/practiceService';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { isValidChart } from '@/lib/server/raml/chartValidation';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 27C: Kanzul method-practice server route. chart is optional — the
// intro screen (before any chart exists) omits it and gets quote/label/
// sourceLabel only; the walkthrough screen supplies it and additionally
// gets the computed row. Session resolved server-side (a Route Handler may
// legitimately persist a session cookie); entitlement resolved server-side
// via canAccessForUser — never trusted from the request body.
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
  const { chapterId, methodId, chart } = body as Record<string, unknown>;

  if (typeof chapterId !== 'string' || typeof methodId !== 'string') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  if (chart !== undefined && chart !== null && !isValidChart(chart)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const user = await getCurrentUser();
  const db = getDb();
  const result = await getPracticeMethodForUser(db, user.id, chapterId, methodId, isValidChart(chart) ? chart : null);

  if (!result.ok) {
    if (result.reason === 'unauthorized') {
      return NextResponse.json(
        { error: 'This method requires an active entitlement.' },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }
    return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    { questionId: result.questionId, label: result.label, sourceQuote: result.sourceQuote, sourceLabel: result.sourceLabel, row: result.row },
    { headers: NO_STORE_HEADERS },
  );
}
