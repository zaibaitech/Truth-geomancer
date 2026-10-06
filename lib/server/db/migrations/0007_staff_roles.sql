-- Staff / author / platform-admin authorization (user-linked). ADDITIVE ONLY:
-- two new tables, no ALTER/DROP of any existing table or column.
--
-- Staff access is deliberately NOT an entitlement. An entitlement means a
-- customer was granted a product (purchase or manual approval). Staff access
-- lives here, is checked separately (lib/server/staff.ts), and never creates,
-- changes or counts as an entitlement, a payment request or a Paystack record.

-- At most one staff role per user. `revoked_at` set = no role (history kept).
-- Only users with a verified email may hold a role; enforced in
-- lib/server/staff.ts (and anonymous users are rejected there).
CREATE TABLE IF NOT EXISTS staff_roles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'author')),
  granted_at TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  revoked_at TEXT
);

-- Author -> book assignments. Books live in content/books.ts, not a table, so
-- book_id has no SQL foreign key: it is validated against that catalogue in
-- lib/server/staff.ts before any row is written. An assignment only grants
-- access while the user ALSO holds an active 'author' role.
CREATE TABLE IF NOT EXISTS book_staff (
  book_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('author')),
  granted_at TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  revoked_at TEXT,
  PRIMARY KEY (book_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_book_staff_user ON book_staff(user_id);
