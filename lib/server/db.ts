// Server-only database composition root (Prompt 26; replaced by Prompt
// 31C's Neon Postgres migration). Production no longer uses node:sqlite —
// see lib/server/db/postgresAdapter.ts. The original production incident
// (`Error: ENOENT: no such file or directory, mkdir '.data'`, diagnosed in
// Prompt 31A/31B) was this file unconditionally trying to open a local
// SQLite file at a path that does not exist on Vercel's serverless
// filesystem (which is read-only outside `/tmp`, and `/tmp` itself is
// ephemeral per-invocation — not a fix, just a different way to lose
// data). See lib/access/README.md's "Database engine chosen, and its
// limits" section for the full history.
//
// This module now only decides WHICH adapter a caller gets — every actual
// database operation goes through the shared, provider-agnostic `Db`
// interface (./db/types.ts). Nothing outside lib/server/db/ imports
// `@neondatabase/serverless` or `node:sqlite` directly.
import { createPostgresDb } from './db/postgresAdapter';
import { createSqliteDb } from './db/sqliteAdapter';
import type { Db } from './db/types';

export type { Db } from './db/types';

/** Opens an isolated, ephemeral database for tests — always the local
 * SQLite-backed adapter (lib/server/db/sqliteAdapter.ts), matching every
 * existing test's own `openDatabase(':memory:')` call. Never touches
 * Postgres and never reaches production code: nothing in app/ or in any
 * non-test lib/server/ module calls this — only *.test.ts files do. */
export function openDatabase(path: string = ':memory:'): Db {
  return createSqliteDb(path);
}

let sharedDb: Db | null = null;

/**
 * The process-wide handle every route/page/service uses for real
 * (non-test) work.
 *
 * PRODUCTION: backed by Neon Postgres via the `DATABASE_URL` environment
 * variable (see lib/server/db/postgresAdapter.ts). There is deliberately
 * NO filesystem fallback in production: if `DATABASE_URL` is unset while
 * `NODE_ENV === 'production'`, this throws immediately with a clear
 * message rather than silently attempting the old, broken local-file
 * path — the same fail-closed pattern this codebase already uses
 * elsewhere (e.g. lib/server/adminAuth.ts's verifyAdminSecret returning
 * false, never a default admin secret, when TG_ADMIN_SECRET is unset).
 *
 * LOCAL DEVELOPMENT (no `DATABASE_URL`, `NODE_ENV !== 'production'`):
 * falls back to a local SQLite file (default `.data/truth-geomancer.db`,
 * gitignored; overridable via `TG_DB_PATH`) so `npm run dev` keeps
 * working without needing a live Postgres connection. This path is never
 * reachable in production — see the check below.
 */
export function getDb(): Db {
  if (sharedDb) return sharedDb;

  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    sharedDb = createPostgresDb(connectionString);
    return sharedDb;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is not configured. Production requires a persistent Neon Postgres ' +
        "connection — see lib/access/README.md, 'Database engine chosen, and its limits'.",
    );
  }

  sharedDb = createSqliteDb(process.env.TG_DB_PATH ?? '.data/truth-geomancer.db');
  return sharedDb;
}
