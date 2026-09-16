import { NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { isValidChart } from '@/lib/server/raml/chartValidation';
import { executeBookPreview, getPreviewStatusForUser } from '@/lib/server/previewService';
import { getPreviewPolicy } from '@/lib/access/previewPolicy';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Read-only status check (Prompt 29, Phase 12). Never consumes. A visitor
// with no session yet has, by construction, never consumed anything, so
// 'available' is the exact (not assumed) answer for them too — the same
// reasoning session.ts's own getCurrentUserIfPresent() comment documents
// for purchase status.
export async function GET(_request: Request, { params }: { params: { bookId: string } }) {
  if (!getPreviewPolicy(params.bookId)) {
    return NextResponse.json({ status: 'unconfigured' }, { headers: NO_STORE_HEADERS });
  }

  const user = await getCurrentUserIfPresent();
  if (!user) {
    return NextResponse.json({ status: 'available' }, { headers: NO_STORE_HEADERS });
  }

  const db = getDb();
  const status = await getPreviewStatusForUser(db, user.id, params.bookId);
  return NextResponse.json({ status }, { headers: NO_STORE_HEADERS });
}

// The one consuming call (Prompt 29, Phase 9). Never accepts a methodId,
// featureKey, userId, or "remaining uses" from the client — the preview
// target comes ENTIRELY from lib/access/previewPolicy.ts, keyed only by
// the bookId in the URL. `chart` is the only client-supplied value this
// route trusts, and only after isValidChart() structural validation
// (Prompt 27C's shared chart validator — the chart itself carries no
// privilege, exactly like the paid reading/practice routes' own use of it).
export async function POST(request: Request, { params }: { params: { bookId: string } }) {
  if (!getPreviewPolicy(params.bookId)) {
    return NextResponse.json({ error: 'No preview is configured for this book.' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  let chart: unknown;
  try {
    const body = await request.json();
    if (typeof body === 'object' && body !== null && 'chart' in body) {
      chart = (body as Record<string, unknown>).chart;
    }
  } catch {
    // No/empty body is fine — chart is optional (feature-target previews
    // like Master's need none at all).
  }
  if (chart !== undefined && !isValidChart(chart)) {
    return NextResponse.json({ error: 'Invalid chart.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const user = await getCurrentUser();
  const db = getDb();
  const result = await executeBookPreview(db, user.id, params.bookId, isValidChart(chart) ? chart : null);

  if (!result.ok) {
    const status = result.reason === 'unconfigured-book' ? 404 : result.reason === 'chart-required' ? 400 : 409;
    const messages: Record<typeof result.reason, string> = {
      'unconfigured-book': 'No preview is configured for this book.',
      'chart-required': 'Cast a chart before requesting this preview.',
      exhausted: 'Your free preview for this book has already been used.',
      'inactive-preview': 'This preview is not currently active.',
    };
    return NextResponse.json({ error: messages[result.reason] }, { status, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(result, { headers: NO_STORE_HEADERS });
}
