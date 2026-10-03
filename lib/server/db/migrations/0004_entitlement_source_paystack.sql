-- Widens entitlements.source's CHECK constraint to allow 'paystack',
-- alongside the existing 'manual-payment' and 'promo' (see lib/access/types.ts's
-- EntitlementSource and lib/server/paystackFulfilment.ts's fulfilCheckout,
-- the only place that ever passes 'paystack' to grantEntitlement). Additive
-- only: does not touch any row, any other column, or any other table.
--
-- The original constraint from 0001_init.sql was declared inline with no
-- explicit name, so Postgres assigned it the default
-- "<table>_<column>_check" name. Dropped and recreated with the same
-- default-shaped name for consistency, widened to the new value set.
ALTER TABLE entitlements DROP CONSTRAINT IF EXISTS entitlements_source_check;
ALTER TABLE entitlements ADD CONSTRAINT entitlements_source_check
  CHECK (source IN ('manual-payment', 'promo', 'paystack'));
