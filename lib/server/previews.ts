// Server-only preview-usage persistence (Prompt 26, Phase 6). This is
// persistence ONLY — no commercial preview is activated anywhere by this
// module (see lib/access/previewCandidates.ts, none of which is marked as
// the production choice). Structurally separate from entitlements.ts: this
// file never imports it and never writes to the `entitlements` table, so
// consuming a preview cannot, by construction, create paid access.
import type { FreePreview, PreviewUsage } from '@/lib/access/types';
import type { Db } from './db';

interface PreviewUsageRow {
  user_id: string;
  preview_id: string;
  uses_consumed: number;
  status: 'available' | 'exhausted';
}

function rowToUsage(row: PreviewUsageRow): PreviewUsage {
  return { userId: row.user_id, previewId: row.preview_id, usesConsumed: row.uses_consumed, status: row.status };
}

export async function getPreviewUsage(db: Db, userId: string, previewId: string): Promise<PreviewUsage | null> {
  const row = await db.queryOne<PreviewUsageRow>('SELECT * FROM preview_usage WHERE user_id = ? AND preview_id = ?', [
    userId,
    previewId,
  ]);
  return row ? rowToUsage(row) : null;
}

export type PreviewConsumeResult =
  | { ok: true; usage: PreviewUsage }
  | { ok: false; reason: 'inactive-preview' | 'exhausted' };

/**
 * Atomically records one use of `preview` by `userId`.
 *
 * `preview` is the FULL FreePreview definition (from
 * lib/access/previewCandidates.ts, or a future author-configured choice)
 * — this module never looks up a preview's own definition from the
 * database, keeping lib/access/ the one source of what a preview even is,
 * the same way products.ts stays authoritative for products
 * (accessService.ts).
 *
 * Wrapped in `db.transaction()` (lib/server/db/types.ts): every read and
 * write below happens on one connection/session, and either all of it
 * commits or none of it does — the async equivalent of the old explicit
 * `BEGIN IMMEDIATE` transaction. Against the SQLite test/dev adapter that
 * still means a whole-database write lock taken up front. Against the
 * production Postgres adapter it means SERIALIZABLE isolation with
 * automatic retry (see lib/server/db/postgresAdapter.ts's own comment) —
 * a different mechanism, but the same guarantee: two concurrent calls for
 * the same (userId, preview.id) can never both observe
 * `uses_consumed = 0` and both commit a write, so `maxUses` can never be
 * exceeded no matter how many calls arrive concurrently.
 */
export async function consumePreviewUse(db: Db, userId: string, preview: FreePreview): Promise<PreviewConsumeResult> {
  if (!preview.active) return { ok: false, reason: 'inactive-preview' };

  return db.transaction(async (tx) => {
    const row = await tx.queryOne<PreviewUsageRow>('SELECT * FROM preview_usage WHERE user_id = ? AND preview_id = ?', [
      userId,
      preview.id,
    ]);
    const current = row ? row.uses_consumed : 0;

    if (current >= preview.maxUses) {
      return { ok: false, reason: 'exhausted' } as const;
    }

    const next = current + 1;
    const status: PreviewUsage['status'] = next >= preview.maxUses ? 'exhausted' : 'available';

    if (row) {
      await tx.execute('UPDATE preview_usage SET uses_consumed = ?, status = ? WHERE user_id = ? AND preview_id = ?', [
        next,
        status,
        userId,
        preview.id,
      ]);
    } else {
      await tx.execute('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)', [
        userId,
        preview.id,
        next,
        status,
      ]);
    }

    return { ok: true, usage: { userId, previewId: preview.id, usesConsumed: next, status } } as const;
  });
}
