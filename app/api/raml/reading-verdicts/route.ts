import { NextResponse } from 'next/server';
import { getReadingVerdictsForIntention } from '@/lib/server/readingVerdictService';
import { isValidChart } from '@/lib/server/raml/chartValidation';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 27B: the browser's own already-cast chart (never secret — it's
// the requester's own result) is the only per-request input; chapterIds
// are never accepted from the client — see readingVerdictService.ts for
// why that specifically is what keeps this endpoint from becoming a
// corpus-harvesting oracle. This route stays deliberately ungated (no
// session/entitlement check) — see readingVerdictService.ts's own header
// for the explicit, confirmed product decision this reflects.

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

  const result = getReadingVerdictsForIntention(intentionId, chart);
  if (!result.ok) {
    return NextResponse.json({ error: 'Unknown question.' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ verdicts: result.verdicts }, { headers: NO_STORE_HEADERS });
}
