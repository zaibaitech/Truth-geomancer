import { NextResponse } from 'next/server';
import type { Chart, ChartHouse } from '@/lib/raml/casting';
import { getReadingVerdictsForIntention } from '@/lib/server/readingVerdictService';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 27B: the browser's own already-cast chart (never secret — it's
// the requester's own result) is the only per-request input; chapterIds
// are never accepted from the client — see readingVerdictService.ts for
// why that specifically is what keeps this endpoint from becoming a
// corpus-harvesting oracle. This route stays deliberately ungated (no
// session/entitlement check) — see readingVerdictService.ts's own header
// for the explicit, confirmed product decision this reflects.
function isValidChartHouse(h: unknown): h is ChartHouse {
  if (typeof h !== 'object' || h === null) return false;
  const house = h as Record<string, unknown>;
  if (typeof house.n !== 'number' || house.n < 1 || house.n > 16) return false;
  if (!Array.isArray(house.pattern) || house.pattern.length !== 4) return false;
  if (!house.pattern.every((d) => d === 1 || d === 2)) return false;
  if (typeof house.star !== 'object' || house.star === null) return false;
  const star = house.star as Record<string, unknown>;
  return typeof star.id === 'string' && typeof star.name === 'string';
}

function isValidChart(c: unknown): c is Chart {
  if (typeof c !== 'object' || c === null) return false;
  const chart = c as Record<string, unknown>;
  return Array.isArray(chart.houses) && chart.houses.length === 16 && chart.houses.every(isValidChartHouse);
}

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
