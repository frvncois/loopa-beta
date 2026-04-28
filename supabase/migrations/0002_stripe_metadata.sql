-- Stripe metadata indexes
-- All Stripe columns already exist from 0001_init.sql.
-- This migration adds an index to speed up webhook lookups by stripe_customer_id.

create index if not exists profiles_stripe_customer_id_idx
  on profiles(stripe_customer_id)
  where stripe_customer_id is not null;
