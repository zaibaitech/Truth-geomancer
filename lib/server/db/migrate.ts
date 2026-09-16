// Deterministic Postgres migration runner (Prompt 31C — Neon Postgres
// migration). Run via `npm run db:migrate`, which requires DATABASE_URL
// to be set in the environment it runs in (see package.json).
//
// Behavior:
//  - Tracks applied migrations in a `schema_migrations` table (filename,
//    applied_at), created on first run if missing.
//  - Applies every *.sql file in ./migrations, in filename order, that
//    is NOT already recorded in schema_migrations — so running this
//    against an already-migrated database is a safe no-op, and running
//    it against a brand-new empty database deterministically creates the
//    full schema.
//  - NEVER drops, truncates, or resets anything — every statement in
//    every migration file here is CREATE TABLE IF NOT EXISTS / CREATE
//    INDEX IF NOT EXISTS, so even re-applying a migration that somehow
//    wasn't recorded is harmless. A future destructive migration (a
//    column rename, a drop) would need explicit, manual review before
//    being added here — this runner applies whatever the migration files
//    say, it does not by itself decide anything is safe.
//  - Each migration file runs inside its own transaction: it either
//    fully applies and gets recorded, or fully rolls back and the run
//    stops (a later file is never applied after an earlier one failed).
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from '@neondatabase/serverless';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set — refusing to run migrations against an unknown database.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await pool.query('SELECT filename FROM schema_migrations')).rows.map((r) => (r as { filename: string }).filename),
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip (already applied): ${file}`);
        continue;
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`applied: ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`FAILED: ${file}`);
        throw err;
      } finally {
        client.release();
      }
    }

    console.log(appliedCount === 0 ? 'Database already up to date.' : `Applied ${appliedCount} migration(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
