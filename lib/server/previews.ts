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

export function getPreviewUsage(db: Db, userId: string, previewId: string): PreviewUsage | null {
  const row = db.prepare('SELECT * FROM preview_usage WHERE user_id = ? AND preview_id = ?').get(userId, previewId) as
    | PreviewUsageRow
    | undefined;
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
 * Wrapped in an explicit `BEGIN IMMEDIATE` transaction: this takes
 * SQLite's write lock up front, before the read, rather than only at the
 * eventual write — closing the classic "two requests both read
 * usesConsumed=0, both write usesConsumed=1" race window entirely. A
 * second call that arrives while the first is mid-transaction blocks
 * until the first commits or rolls back, then sees the first call's
 * result and is evaluated against it — so `maxUses` can never be
 * exceeded no matter how many calls arrive back to back. (This
 * serialization is per-database-file; a real multi-instance production
 * deployment needs the equivalent transactional guarantee from whatever
 * hosted database replaces this one — see lib/access/README.md.)
 */
export function consumePreviewUse(db: Db, userId: string, preview: FreePreview): PreviewConsumeResult {
  if (!preview.active) return { ok: false, reason: 'inactive-preview' };

  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db
      .prepare('SELECT * FROM preview_usage WHERE user_id = ? AND preview_id = ?')
      .get(userId, preview.id) as PreviewUsageRow | undefined;
    const current = row ? row.uses_consumed : 0;

    if (current >= preview.maxUses) {
      db.exec('ROLLBACK');
      return { ok: false, reason: 'exhausted' };
    }

    const next = current + 1;
    const status: PreviewUsage['status'] = next >= preview.maxUses ? 'exhausted' : 'available';

    if (row) {
      db.prepare('UPDATE preview_usage SET uses_consumed = ?, status = ? WHERE user_id = ? AND preview_id = ?').run(
        next,
        status,
        userId,
        preview.id,
      );
    } else {
      db.prepare('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)').run(
        userId,
        preview.id,
        next,
        status,
      );
    }

    db.exec('COMMIT');
    return { ok: true, usage: { userId, previewId: preview.id, usesConsumed: next, status } };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
