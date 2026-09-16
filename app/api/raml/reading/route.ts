import { NextResponse } from 'next/server';
import { getReadingResult } from '@/lib/server/raml/readingService';
import { isValidChart } from '@/lib/server/raml/chartValidation';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 27C: the Overview/"Your Reading" flow's server-side counterpart to
// runReading() — see readingService.ts for the access-decision reasoning
// (deliberately free/ungated, matching the pre-existing product design).
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

  const result = getReadingResult(chart, intentionId);
  if (!result) {
    return NextResponse.json({ error: 'Not covered by the engine.' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ result }, { headers: NO_STORE_HEADERS });
}
