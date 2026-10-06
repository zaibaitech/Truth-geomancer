// One-off, operator-run bootstrap for the FIRST platform admin.
//
//   DATABASE_URL=<production url> npm run staff:bootstrap-admin -- --email person@example.com
//
// Grants `platform_admin` to an EXISTING user whose email is already verified
// (they must have signed in to the app with it at least once). It never
// creates a user, never reads an email from a web request, and is not
// reachable from the application — only from a shell with database access.
// After this, that person signs in normally and manages all other staff from
// /admin/staff. Re-running it is harmless (the role is simply re-activated).
import { getDb } from '../db';
import { getStaffRole } from '../staff';
import { findVerifiedUserByEmail, grantStaffRole } from '../staffAdmin';

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

async function main() {
  const email = argValue('--email');
  if (!email) {
    console.error('Usage: npm run staff:bootstrap-admin -- --email person@example.com');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL && !process.env.TG_DB_PATH) {
    console.error('Set DATABASE_URL (production) or TG_DB_PATH (local SQLite) — refusing to guess the database.');
    process.exit(1);
  }

  const db = getDb();
  try {
    const target = await findVerifiedUserByEmail(db, email);
    if (!target.ok) {
      const why: Record<string, string> = {
        'invalid-email': 'That is not a valid email address.',
        'no-verified-user': 'No verified account uses that email. Sign in to the app with it once, then re-run.',
        'ambiguous-email': 'More than one account uses that email — resolve this manually first.',
      };
      console.error(why[target.reason] ?? `Refused: ${target.reason}`);
      process.exit(1);
    }
    const result = await grantStaffRole(db, { targetUserId: target.userId, role: 'platform_admin', grantedBy: 'bootstrap' });
    if (!result.ok) {
      console.error(`Refused: ${result.reason}`);
      process.exit(1);
    }
    const role = await getStaffRole(db, target.userId);
    if (role !== 'platform_admin') {
      console.error('Verification failed: the role was not found after writing it.');
      process.exit(1);
    }
    console.log(`OK: ${target.email} (user ${target.userId}) is now platform_admin.`);
  } catch (err) {
    console.error('Bootstrap failed:', err instanceof Error ? err.message : err);
    console.error('Has migration 0007_staff_roles.sql been applied (npm run db:migrate)?');
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
