// PRODUCTION DATABASE ADAPTER (Prompt 31C — Neon Postgres migration).
// The ONLY file in this codebase that imports `@neondatabase/serverless`
// or writes Postgres-dialect SQL — every server module upstream of this
// (identity.ts, entitlements.ts, previews.ts, paymentRequests.ts, etc.)
// is written against the provider-agnostic `Db` interface in ./types.ts
// and never knows which adapter is actually running.
//
// `@neondatabase/serverless`'s `Pool`/`PoolClient` are drop-in,
// WebSocket-based equivalents of `node-postgres`'s API, purpose-built for
// serverless: connections are established over WebSocket rather than a
// long-lived TCP socket, so many short-lived Vercel function invocations
// don't exhaust a fixed connection-count limit the way a raw `pg.Pool`
// would. This is why Neon is the right fit for Vercel serverless (see the
// Prompt 31B audit's own recommendation).
import { Pool, type PoolClient } from '@neondatabase/serverless';
import type { Db } from './types';

/** Every service module writes SQL with SQLite-style positional `?`
 * placeholders (unchanged from before this migration, to minimize churn
 * across ~15 already-tested modules) — this is the one place that
 * rewrites them to Postgres's `$1, $2, ...` before sending the query.
 * Safe because no SQL string anywhere in lib/server/*.ts contains a
 * literal `?` character outside of a placeholder position. */
function toPostgresSql(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

interface Queryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

/** Builds a `Db` bound to one already-open connection/session (a
 * transaction's `PoolClient`) — every call routes through that SAME
 * connection, never back through the pool, which is what keeps a
 * transaction's reads and writes on one Postgres session. */
function dbBoundTo(target: Queryable): Db {
  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const result = await target.query(toPostgresSql(sql), params);
      return result.rows as T[];
    },
    async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      const result = await target.query(toPostgresSql(sql), params);
      return (result.rows[0] as T | undefined) ?? null;
    },
    async execute(sql: string, params: unknown[] = []): Promise<void> {
      await target.query(toPostgresSql(sql), params);
    },
    // This codebase never nests a transaction() call inside another — a
    // nested call here just keeps running on the same connection/session
    // rather than opening a second one, which would be wrong (a second
    // BEGIN on the same session is a Postgres error). This branch exists
    // only as a safety net; it is never exercised by real call sites.
    async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
      return fn(dbBoundTo(target));
    },
    // A connection-bound Db never owns the connection's lifecycle — only
    // the top-level PostgresDb (owning the Pool) and its transaction()
    // method (owning one checked-out PoolClient) do.
    async close(): Promise<void> {},
  };
}

const RETRYABLE_POSTGRES_CODES = new Set([
  '40001', // serialization_failure
  '40P01', // deadlock_detected
]);

class PostgresDb implements Db {
  constructor(private readonly pool: Pool) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.pool.query(toPostgresSql(sql), params);
    return result.rows as T[];
  }

  async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const result = await this.pool.query(toPostgresSql(sql), params);
    return (result.rows[0] as T | undefined) ?? null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.pool.query(toPostgresSql(sql), params);
  }

  /**
   * Real Postgres transaction, replacing the old
   * `db.exec('BEGIN IMMEDIATE') ... COMMIT/ROLLBACK` pattern
   * (lib/server/previews.ts's consumePreviewUse, lib/server/
   * paymentRequests.ts's approvePaymentRequest).
   *
   * SQLite's `BEGIN IMMEDIATE` took the whole database's write lock
   * up front, so a concurrent second call simply blocked until the first
   * committed — a correct but coarse (whole-file) lock. Postgres has no
   * equivalent "lock everything up front" primitive, and this codebase's
   * SQL is plain SELECT/UPDATE/INSERT with no `SELECT ... FOR UPDATE`
   * (a SQLite-incompatible dialect difference this adapter deliberately
   * does not require of the shared SQL — see ./types.ts's own comment).
   * Instead this uses Postgres's SERIALIZABLE isolation level: if two
   * concurrent transactions' reads and writes would be inconsistent with
   * SOME serial (one-at-a-time) execution order — exactly the
   * "both read uses_consumed=0, both write uses_consumed=1" race this
   * function exists to prevent — Postgres aborts one of them with a
   * `serialization_failure` (40001) rather than letting both commit.
   * This adapter catches exactly that (and `deadlock_detected`, 40P01)
   * and transparently retries the WHOLE callback on a fresh connection,
   * up to 5 times — the standard, documented pattern for using
   * SERIALIZABLE correctly (a caller of `transaction()` never needs to
   * know retries happened; it only ever sees success or a real error).
   */
  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    const MAX_ATTEMPTS = 5;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
        const result = await fn(dbBoundTo(client));
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        lastError = err;
        const code = (err as { code?: string } | null)?.code;
        if (!code || !RETRYABLE_POSTGRES_CODES.has(code)) throw err;
        // else: fall through to the next attempt on a fresh connection.
      } finally {
        client.release();
      }
    }

    throw lastError;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createPostgresDb(connectionString: string): Db {
  return new PostgresDb(new Pool({ connectionString }));
}

// Re-exported only for the migration runner (lib/server/db/migrate.ts),
// which needs a raw client to run schema DDL outside the query-translation
// path above (DDL statements have no `?` placeholders to translate, and
// running them through the same Pool would be misleading — a migration is
// not an application query).
export { Pool, type PoolClient };
