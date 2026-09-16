// Shared async database contract (Prompt 31C — Neon Postgres migration).
// Every server module that touches persistence (identity.ts, session.ts,
// entitlements.ts, previews.ts, previewService.ts, adminAuth.ts,
// adminSession.ts, paymentRequests.ts, contentService.ts, purchaseStatus.ts,
// practiceService.ts, accessService.ts) is written against this interface
// only — never against `@neondatabase/serverless` or `node:sqlite`
// directly. That keeps provider-specific code concentrated in
// lib/server/db/postgresAdapter.ts (production) and
// lib/server/db/sqliteAdapter.ts (tests/local dev only), exactly as
// lib/access/README.md's "Database engine chosen, and its limits" section
// already documented as the intended seam.
//
// Deliberately NOT a `.prepare(sql).get()/.all()/.run()` wrapper: that
// shape only exists because node:sqlite's DatabaseSync happens to be
// synchronous. A real Postgres connection is asynchronous by nature, so
// every operation here returns a Promise — there is no synchronous
// escape hatch anywhere in this contract.
export interface Db {
  /** Runs `sql` and returns every matching row. SQL is written with
   * SQLite-style positional `?` placeholders throughout this codebase
   * (unchanged from before this migration) — each adapter translates
   * them to its own dialect internally; callers never need to know which
   * adapter is in use. */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;

  /** Same as `query`, but returns only the first row (or `null` if none
   * matched) — the async equivalent of the old `.prepare(sql).get()`. */
  queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;

  /** Runs `sql` for its side effect (INSERT/UPDATE/DELETE) and discards
   * any returned rows — the async equivalent of the old
   * `.prepare(sql).run()`. */
  execute(sql: string, params?: unknown[]): Promise<void>;

  /**
   * Runs `fn` inside a real database transaction: every call `fn` makes
   * through the `tx` handle it receives happens on the SAME underlying
   * connection/session, and either all of it commits or none of it does.
   *
   * This is the ONLY correct way to reproduce the old
   * `db.exec('BEGIN IMMEDIATE') ... COMMIT/ROLLBACK` pattern
   * (lib/server/previews.ts's consumePreviewUse, lib/server/
   * paymentRequests.ts's approvePaymentRequest) — issuing the same
   * statements as independent `query`/`execute` calls on a pooled
   * connection would put them on different connections and lose the
   * atomicity guarantee entirely. See postgresAdapter.ts's own comment
   * for how it implements this against Neon (SERIALIZABLE isolation with
   * automatic retry, rather than relying on a `SELECT ... FOR UPDATE`
   * SQL dialect difference that SQLite's test adapter cannot share).
   */
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;

  /** Releases whatever resource this Db owns (a pool, a file handle).
   * Safe to call multiple times. Every test's `afterEach` calls this. */
  close(): Promise<void>;
}
