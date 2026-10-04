-- Customer details collected for checkout, and a record of every Paystack
-- transaction we start. Additive only: no existing table or row is touched.
--
-- customer_profiles is kept separate from users on purpose — users has
-- anonymous rows with no identity at all, and an ALTER on that table would
-- gain nothing over a 1:1 side table.
--
-- paystack_payments is what lets fulfilment check a verified transaction
-- against what THIS server asked Paystack to charge (user, product, amount,
-- currency), instead of trusting only what Paystack's metadata echoes back.
-- `reference` is the primary key, so a reference can never be recorded twice.
CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS paystack_payments (
  reference TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('initiating', 'pending', 'success', 'failed', 'abandoned')),
  authorization_url TEXT,
  paystack_transaction_id TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  verified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_paystack_payments_user_product
  ON paystack_payments(user_id, product_id, created_at);
